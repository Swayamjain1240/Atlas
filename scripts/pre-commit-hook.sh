#!/bin/sh
# Atlas Pre-Commit Hook
# Scans for secrets, runs basic checks before every commit.

echo "🔍 Atlas Pre-Commit Check"

# 1. Check for real .env being committed
if git diff --cached --name-only | grep -q -E "^\.env$"; then
  echo "❌ ERROR: .env is staged for commit - contains secrets!"
  echo "   Use .env.example instead."
  exit 1
fi

# 2. Check for actual secrets in staged files (skip .env.example)
STAGED_FILES=$(git diff --cached --name-only)
for FILE in $STAGED_FILES; do
  if [ -f "$FILE" ]; then
    # Skip template files
    case "$FILE" in
      *.example|*.md|*.pdf) continue ;;
    esac
    # Check for hardcoded secrets
    if grep -qE '(password|secret|api_key|token)\s*=\s*['\''"][^'\''"]+['\''"]' "$FILE" 2>/dev/null; then
      echo "❌ ERROR: Possible hardcoded secret in $FILE"
      exit 1
    fi
  fi
done

echo "✅ Pre-commit checks passed"
