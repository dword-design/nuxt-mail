# Need to add :latest, otherwise old versions (e.g. of node) are installed
FROM gitpod/workspace-full:latest

RUN sudo apt-get update && sudo apt-get install -y libgtk-3-0 libx11-xcb1 libnss3 libxss1 libasound2 libgbm1