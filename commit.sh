#!/bin/bash

# Initialize repository
git init
git branch -M main

# Helper function to commit incrementally
commit() {
  local msg="$1"
  shift
  # Only add if files exist and matched something
  for path in "$@"; do
    if [ -e "$path" ] || ls $path >/dev/null 2>&1; then
      git add "$path"
    fi
  done
  
  if ! git diff --cached --quiet; then
    git commit -m "$msg"
  fi
}

# 1. Root
commit "docs: initialize project and root configuration" README.md system_design.md .gitignore commit.sh

# --- BACKEND (7 commits) ---
commit "build(backend): setup project dependencies and config" backend/package.json backend/package-lock.json backend/.env.example backend/.gitignore backend/server.js
commit "chore(backend): core configuration files" backend/src/config/ backend/src/utils/
commit "feat(backend): data models and mongoose schemas" backend/src/models/
commit "feat(backend): core business services and integrations" backend/src/services/
commit "feat(backend): api controllers for business logic" backend/src/controllers/
commit "feat(backend): api routes and middleware setup" backend/src/routes/ backend/src/middleware/
commit "chore(backend): remaining backend assets" backend/

# --- ADMIN PANEL (7 commits) ---
commit "build(admin): setup project dependencies and config" admin/package.json admin/package-lock.json admin/vite.config.ts admin/tsconfig.json admin/tsconfig.node.json admin/index.html admin/.env.example admin/.gitignore admin/vercel.json
commit "feat(admin): theme, typography and core layout" admin/src/theme/ admin/src/components/layout/ admin/src/assets/
commit "feat(admin): global state management and api services" admin/src/store/ admin/src/services/ admin/src/utils/
commit "feat(admin): shared ui components" admin/src/components/common/ admin/src/components/ui/
commit "feat(admin): dashboard and authentication pages" admin/src/pages/Dashboard/ admin/src/pages/Auth/ admin/src/App.tsx admin/src/main.tsx admin/src/routes.tsx
commit "feat(admin): data management and listing pages" admin/src/pages/
commit "chore(admin): remaining admin assets" admin/

# --- STOREFRONT (7 commits) ---
commit "build(storefront): setup project dependencies and config" storefront/package.json storefront/package-lock.json storefront/next.config.ts storefront/postcss.config.mjs storefront/tsconfig.json storefront/.env.example storefront/.gitignore
commit "feat(storefront): core styling and css variables" storefront/src/app/globals.css storefront/tailwind.config.ts storefront/tailwind.config.js
commit "feat(storefront): root layouts and context providers" storefront/src/app/layout.tsx storefront/src/providers/ storefront/src/components/layout/
commit "feat(storefront): shared ui components and design system" storefront/src/components/ui/ storefront/src/components/common/
commit "feat(storefront): global state management and utilities" storefront/src/store/ storefront/src/utils/ storefront/src/lib/
commit "feat(storefront): page routes and templates" storefront/src/app/
commit "chore(storefront): remaining storefront assets and configuration" storefront/

# --- MOBILE APP (8 commits) ---
commit "build(mobile): setup project dependencies and config" mobile/package.json mobile/app.json mobile/babel.config.js mobile/metro.config.js mobile/index.js mobile/.env.example mobile/.gitignore
commit "build(mobile): android native project files" mobile/android/
commit "build(mobile): ios native project files" mobile/ios/
commit "feat(mobile): theme tokens and app constants" mobile/src/constants/ mobile/src/theme/
commit "feat(mobile): navigation architecture and routing" mobile/src/navigation/ mobile/src/App.tsx
commit "feat(mobile): global state management and api integration" mobile/src/store/ mobile/src/services/ mobile/src/utils/
commit "feat(mobile): shared application components" mobile/src/components/
commit "feat(mobile): main application screens" mobile/src/screens/
commit "chore(mobile): remaining mobile assets and scripts" mobile/

# Final catch-all (just in case anything was missed)
git add .
if ! git diff --cached --quiet; then
  git commit -m "chore: final project configurations and assets"
fi

