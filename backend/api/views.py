from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from sqlite3 import IntegrityError
from rest_framework.pagination import PageNumberPagination
from .serializers import (
    UserSerializer,
    PostSerializer,
    ProfileSerializer,
)
from .models import Post, Profile, Like

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 20
    
class UserAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new user with a username and password.
        Automatically create a matching Profile upon successful user creation.
        """
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create the user with a default email
            user = User.objects.create_user(
                username=username,
                password=password,
                email=f"{username}@example.com"  # A default email for demonstration
            )

            # Create a corresponding Profile automatically
            Profile.objects.create(
                user=user,
                profilename=username,
                email=user.email,   # or any logic for your Profile email
                profileimage=None
            )

            return Response(
                {"message": "User (and Profile) created successfully."},
                status=status.HTTP_201_CREATED
            )
        except IntegrityError as e:
            # E.g. if the email is not unique
            return Response(
                {"error": f"Integrity Error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class PostAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        following_profiles = user.profile.following.all()
        posts_qs = Post.objects.filter(
            Q(owner__profile__in=following_profiles) | Q(owner=user)
        ).order_by('-created_at')

        paginator = CustomPageNumberPagination()
        paginated_posts = paginator.paginate_queryset(posts_qs, request)
        serializer = PostSerializer(paginated_posts, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        """
        Create a new post (owned by the current user).
        """
        serializer = PostSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        """
        - If `id` is provided, retrieve the Profile with that ID.
        - Else if `search` query param is given, search profiles by name.
        - Else, retrieve or create a default Profile for the authenticated user.
        """
        search_query = request.query_params.get('search', None)
        user = request.user

        if id:
            # Retrieve a specific profile by ID
            try:
                profile = Profile.objects.get(id=id)
            except Profile.DoesNotExist:
                return Response(
                    {"error": "Profile not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = ProfileSerializer(profile, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif search_query:
            # Search for profiles matching the query
            profiles = Profile.objects.filter(
                profilename__icontains=search_query
            )[:4]
            serializer = ProfileSerializer(
                profiles, 
                many=True, 
                context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        else:
            # Retrieve or create the authenticated user's profile
            profile, created = Profile.objects.get_or_create(
                user=user,
                defaults={
                    "profilename": user.username,
                    "email": f"user_{user.id}@example.com",  # fallback email
                    "profileimage": None,
                },
            )
            serializer = ProfileSerializer(profile, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """
        Update the authenticated user's Profile fields (and possibly User.email).
        """
        user = request.user

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data

        # Update the User's email if provided
        if "email" in data:
            user.email = data["email"]
            try:
                user.save()  # could raise IntegrityError if email not unique
            except IntegrityError:
                return Response(
                    {"error": "This email is already in use."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Update the Profile fields
        serializer = ProfileSerializer(
            profile, 
            data=data, 
            partial=True, 
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """
        Manually create a new Profile for the current user
        only if they don't have one yet (rarely needed if you
        auto-create via the user sign-up flow).
        """
        user = request.user
        if Profile.objects.filter(user=user).exists():
            return Response(
                {"error": "Profile already exists."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ProfileSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Delete the authenticated user's profile.
        (For many apps, you might prefer to deactivate rather than delete.)
        """
        user = request.user
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        profile.delete()
        return Response(
            {"message": "Profile deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


class PostDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Retrieve a specific post by PK."""
        try:
            return Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        """Retrieve a specific post."""
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Update a specific post (only if the user is the owner).
        """
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        if post.owner != request.user:
            raise PermissionDenied("You do not have permission to edit this post.")

        serializer = PostSerializer(
            post, 
            data=request.data, 
            partial=True, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """
        Add or remove a like on a post.
        If the user has already liked it, remove that like (unlike).
        Otherwise, create a new like.
        """
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user already liked the post
        existing_like = Like.objects.filter(post=post, owner=request.user).first()
        if existing_like:
            existing_like.delete()  # Unlike
            return Response({"message": "Like removed."}, status=status.HTTP_200_OK)
        else:
            Like.objects.create(post=post, owner=request.user)  # Like
            return Response({"message": "Post liked."}, status=status.HTTP_201_CREATED)
    
    def delete(self,request,pk):
        
        post = self.get_object(pk)
        if not post:
            return Response(
                {"error": "Post not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # (Optional) Make sure only the owner can delete:
        if post.owner != request.user:
            return Response(
                {"error": "Not authorized to delete this post."},
                status=status.HTTP_403_FORBIDDEN
            )

        post.delete()
        return Response(
            {"message": "Post removed."},
            status=status.HTTP_200_OK
        )

class FollowAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):
        """
        Toggle follow/unfollow for the authenticated user.
        'id' is the ID of the Profile to follow/unfollow.
        """
        try:
            profile_to_follow = Profile.objects.get(id=id)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        requester_profile = request.user.profile

        if profile_to_follow == requester_profile:
            return Response(
                {"error": "You cannot follow yourself."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if requester_profile.is_following(profile_to_follow):
            # Unfollow
            requester_profile.unfollow(profile_to_follow)
            action = "unfollowed"
        else:
            # Follow
            requester_profile.follow(profile_to_follow)
            action = "followed"

        return Response({
            "message": f"Successfully {action} {profile_to_follow.profilename}.",
            "is_following": requester_profile.is_following(profile_to_follow),
            "followers_count": profile_to_follow.followers.count()
        }, status=status.HTTP_200_OK)
