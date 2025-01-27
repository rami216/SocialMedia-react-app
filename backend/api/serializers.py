from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Profile, Like

class ProfileSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    isOwner = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id',
            'user',
            'user_username',
            'user_email',
            'profilename',
            'profileimage',
            'followers_count',
            'following_count',
            'is_following',
            'isOwner'
        ]
        read_only_fields = [
            'id', 
            'user', 
            'followers_count', 
            'following_count', 
            'is_following',
            'isOwner'
        ]

    def get_user_email(self, obj):
        """Retrieve the email from the User model."""
        return obj.user.email

    def get_followers_count(self, obj):
        """Number of users following this profile."""
        return obj.followers.count()

    def get_following_count(self, obj):
        """Number of users this profile is following."""
        return obj.following.count()

    def get_is_following(self, obj):
        """
        Check if the logged-in user is following this profile.
        That is, 'obj' is in the requesting user's following.
        """
        user = self.context['request'].user
        if user.is_authenticated and hasattr(user, 'profile'):
            return user.profile.is_following(obj)
        return False

    def get_isOwner(self, obj):
        """Check if the requesting user is the owner of this profile."""
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.user == user
        return False


class UserSerializer(serializers.ModelSerializer):
    """
    Basic serializer for the User model.
    We do not directly create a Profile here,
    since we do that in the UserAPIView for clarity.
    """
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class PostSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    isOwner = serializers.SerializerMethodField()
    isLiked = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    owner_profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 
            'content', 
            'owner', 
            'owner_username',
            'owner_profile_image', 
            'isOwner', 
            'isLiked', 
            'likes_count', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_isOwner(self, obj):
        """Check if the requesting user is the owner of the post."""
        user = self.context['request'].user
        return user.is_authenticated and (obj.owner == user)

    def get_isLiked(self, obj):
        """Check if the requesting user has liked the post."""
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.likes.filter(owner=user).exists()
        return False

    def get_likes_count(self, obj):
        """Calculate the total likes for the post."""
        return obj.likes.count()

    def get_owner_profile_image(self, obj):
        """Retrieve the profile image of the owner."""
        if obj.owner.profile.profileimage:
            return obj.owner.profile.profileimage.url
        return None


class LikeSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    post_content = serializers.ReadOnlyField(source='post.content')

    class Meta:
        model = Like
        fields = [
            "id", 
            "owner", 
            "owner_username", 
            "post", 
            "post_content", 
            "created_at"
        ]
        read_only_fields = ["id", "owner", "post", "created_at"]
