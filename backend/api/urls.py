from django.urls import path
from . import views

urlpatterns = [
    path("user/", views.UserAPIView.as_view(), name="register_user"),
    path("profile/", views.ProfileAPIView.as_view(), name="my_profile"),
    path("profile/<int:id>/", views.ProfileAPIView.as_view(), name="other_profile"),
    path("profile/<int:id>/follow/", views.FollowAPIView.as_view(), name="follow_profile"),
    
    path("posts/", views.PostAPIView.as_view(), name="post_list_create"),
    path("posts/<int:pk>/", views.PostDetailAPIView.as_view(), name="post_detail"),
]
