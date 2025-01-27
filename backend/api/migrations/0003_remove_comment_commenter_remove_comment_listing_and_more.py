# Generated by Django 4.2.18 on 2025-01-21 09:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_listing_watchlist'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='comment',
            name='commenter',
        ),
        migrations.RemoveField(
            model_name='comment',
            name='listing',
        ),
        migrations.RemoveField(
            model_name='listing',
            name='category',
        ),
        migrations.RemoveField(
            model_name='listing',
            name='highest_bid',
        ),
        migrations.RemoveField(
            model_name='listing',
            name='owner',
        ),
        migrations.RemoveField(
            model_name='listing',
            name='watchlist',
        ),
        migrations.DeleteModel(
            name='Bid',
        ),
        migrations.DeleteModel(
            name='Category',
        ),
        migrations.DeleteModel(
            name='Comment',
        ),
        migrations.DeleteModel(
            name='Listing',
        ),
    ]
