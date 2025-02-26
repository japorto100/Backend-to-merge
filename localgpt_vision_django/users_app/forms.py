from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import UserProfile

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

class UserSettingsForm(forms.ModelForm):
    """Form for updating user settings"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['first_name'].widget.attrs.update({'class': 'form-control'})
        self.fields['last_name'].widget.attrs.update({'class': 'form-control'})
        self.fields['email'].widget.attrs.update({'class': 'form-control'})

class UserProfileForm(forms.ModelForm):
    """Form for updating user profile"""
    class Meta:
        model = UserProfile
        fields = ['theme', 'default_model', 'openai_api_key', 'anthropic_api_key']
        widgets = {
            'openai_api_key': forms.PasswordInput(render_value=True),
            'anthropic_api_key': forms.PasswordInput(render_value=True),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['theme'].widget.attrs.update({'class': 'form-select'})
        self.fields['default_model'].widget.attrs.update({'class': 'form-select'})
        self.fields['openai_api_key'].widget.attrs.update({'class': 'form-control'})
        self.fields['anthropic_api_key'].widget.attrs.update({'class': 'form-control'}) 