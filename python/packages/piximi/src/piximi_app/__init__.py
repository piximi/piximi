"""Piximi as an application: the ``piximi`` command, the frontend build it
serves, the JupyterLab launcher tile and the notebook helper.

The engine is an optional dependency (``piximi[engine]``): everything that
needs it imports it where it is used, so a machine without it can still
serve the frontend.
"""
