#!/bin/sh

set -e
set -x  # Print each command for debugging in Xcode Cloud logs

echo "Current Directory before cd: $(pwd)"
cd ../../
echo "Current Directory after cd: $(pwd)"

echo "Setting up Node.js using Homebrew..."
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node@20 || true
brew link --overwrite node@20 || true
export PATH="/usr/local/opt/node@20/bin:$PATH"

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "Installing NPM dependencies..."
npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

echo "Installing CocoaPods via Bundler..."
bundle config set --local retries 5
bundle install || bundle install || bundle install

echo "Running pod install..."

cd ios
bundle exec pod install

echo "ci_post_clone.sh successfully finished!"
