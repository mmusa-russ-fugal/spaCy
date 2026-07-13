# Toolchain baseline (migration phase 0): Node 22 LTS + Python 3.12.
# Python 3.12 is provided by the base image; Node 22 LTS is layered on via
# NodeSource. These match the versions pinned in .nvmrc, package.json "engines"
# and runtime.txt, so the container can run the full `npm run build` — whose
# Python prebuild (setup/setup.sh) regenerates the quickstart training generator.
FROM python:3.12-bookworm

# Node.js 22 LTS from NodeSource.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# The python base image ships no unprivileged user; create one to preserve the
# original image's non-root posture.
RUN useradd --create-home --shell /bin/bash node
USER node

# This is so the installed node_modules will be up one directory
# from where a user mounts files, so that they don't accidentally mount
# their own node_modules from a different build
# https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders
WORKDIR /home/node
COPY --chown=node package.json .
COPY --chown=node package-lock.json .
RUN npm install

WORKDIR /home/node/website/
