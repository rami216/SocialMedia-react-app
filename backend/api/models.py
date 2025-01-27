from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    """
    Each User has exactly one Profile.
    `followers` is the set of Profiles that follow *this* profile.
    Because we set related_name='following', from the perspective of any Profile X,
    X.following = the set of profiles X is following.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name="profile"
    )
    profilename = models.CharField(max_length=300)
    email = models.EmailField(max_length=300, unique=True, blank=True, null=True)
    profileimage = models.ImageField(upload_to='profile_images/', blank=True, null=True)

    # A->followers means "A" is followed BY these profiles
    # related_name='following' means from B’s viewpoint: B.following includes A if B is in A.followers
    followers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='following',
        blank=True
    )

    def follow(self, profile):
        
        if profile != self:
            profile.followers.add(self)

    def unfollow(self, profile):
       
        if self in profile.followers.all():
            profile.followers.remove(self)

    def is_following(self, profile):
        
       
        return self.following.filter(id=profile.id).exists()

    def is_followed_by(self, profile):
        """
        Check if `self` is followed by `profile`.
        That is true if 'profile' is in `self.followers`.
        """
        return self.followers.filter(id=profile.id).exists()

    def __str__(self):
        return self.profilename


class Post(models.Model):
    content = models.TextField()
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="posts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post by {self.owner.username} at {self.created_at}"


class Like(models.Model):
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name="likes"
    )
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.owner.username} liked post {self.post.id}"
