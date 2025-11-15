#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  FinancePro - API Generation Pipeline${NC}"
echo -e "${BLUE}  Pydantic → OpenAPI → TypeScript + Zod + React Query${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Generate OpenAPI from FastAPI backend
echo -e "${YELLOW}📝 Step 1/3: Generating OpenAPI specification from FastAPI...${NC}"
cd "$BACKEND_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
else
    source venv/bin/activate
fi

# Run OpenAPI generation script
python scripts/generate_openapi.py

if [ ! -f "openapi.json" ]; then
    echo -e "${RED}❌ OpenAPI generation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenAPI schema generated successfully!${NC}"
echo ""

# Step 2: Generate TypeScript types, Zod schemas, and React Query hooks
echo -e "${YELLOW}⚡ Step 2/3: Generating TypeScript, Zod schemas, and React Query client...${NC}"
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Run Orval
npx orval --config orval.config.ts

if [ ! -d "src/api/generated" ]; then
    echo -e "${RED}❌ Orval generation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TypeScript + Zod + React Query client generated!${NC}"
echo ""

# Step 3: Verify and report
echo -e "${YELLOW}🔍 Step 3/3: Verifying generated files...${NC}"

# Count generated files
OPENAPI_SIZE=$(du -h "$BACKEND_DIR/openapi.json" | cut -f1)
GENERATED_FILES=$(find "$FRONTEND_DIR/src/api/generated" -type f -name "*.ts" | wc -l)
ZOD_SIZE=$(du -h "$FRONTEND_DIR/src/api/generated/zod.ts" 2>/dev/null | cut -f1 || echo "0")

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All API artifacts generated successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "  • OpenAPI schema: ${GREEN}$OPENAPI_SIZE${NC} (backend/openapi.json)"
echo -e "  • Generated files: ${GREEN}$GENERATED_FILES TypeScript files${NC}"
echo -e "  • Zod schemas: ${GREEN}$ZOD_SIZE${NC} (frontend/src/api/generated/zod.ts)"
echo ""
echo -e "${BLUE}📂 Generated structure:${NC}"
echo -e "  ${GREEN}frontend/src/api/generated/${NC}"
echo -e "    ├── accounts/          # Account endpoints"
echo -e "    ├── authentication/    # Auth endpoints"
echo -e "    ├── categories/        # Category endpoints"
echo -e "    ├── health/            # Health check endpoints"
echo -e "    ├── models/            # TypeScript models"
echo -e "    └── zod.ts             # Zod validation schemas"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "  1. Review generated files in ${GREEN}frontend/src/api/generated/${NC}"
echo -e "  2. Start development: ${GREEN}cd frontend && npm run dev${NC}"
echo -e "  3. Check usage examples: ${GREEN}frontend/USAGE_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"
