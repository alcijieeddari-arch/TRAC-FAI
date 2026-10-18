"""
WSGI configuration for PythonAnywhere deployment.
In PythonAnywhere Web Tab:
WSGI configuration file: point to this file, or paste the contents into the Web tab WSGI file.
"""
import sys
import os

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_DIR, 'backend')

if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.app import app as application
