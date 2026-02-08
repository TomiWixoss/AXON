# AXON Project Setup

This document describes the project infrastructure setup for the AXON logging framework.

## Project Structure

```
AXON/
├── src/                    # Source code
│   ├── serializer/        # TOON serializer implementation
│   ├── parser/            # TOON parser implementation
│   ├── logger/            # Logger API implementation
│   ├── file-manager/      # File I/O and rotation
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── tests/                 # Test files
├── dist/                  # Compiled output (generated)
├── node_modules/          # Dependencies (generated)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── tsconfig.eslint.json   # TypeScript config for ESLint
├── jest.config.js         # Jest test configuration
├── webpack.config.js      # Browser bundle configuration
├── .eslintrc.js           # ESLint configuration
├── .prettierrc.js         # Prettier configuration
└── .gitignore             # Git ignore rules
```

## Technology Stack

- **Language**: TypeScript 5.3.3
- **Test Runner**: Jest 29.7.0
- **Property Testing**: fast-check 3.15.0
- **Linting**: ESLint 8.56.0 with TypeScript plugin
- **Formatting**: Prettier 3.1.1
- **Bundler**: Webpack 5.89.0 (for browser builds)

## Available Scripts

### Build Commands

- `npm run build` - Compile TypeScript to JavaScript (Node.js target)
- `npm run build:browser` - Create browser bundle using Webpack
- `npm run clean` - Remove dist directory

### Test Commands

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality Commands

- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix auto-fixable linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

## Configuration Details

### TypeScript Configuration

The project uses strict TypeScript settings:
- Target: ES2020
- Module: CommonJS (for Node.js compatibility)
- Strict mode enabled
- Declaration files generated
- Source maps enabled

### Jest Configuration

- Test environment: Node.js
- Test files: `tests/**/*.test.ts`
- Coverage thresholds:
  - Branches: 85%
  - Functions: 90%
  - Lines: 90%
  - Statements: 90%

### ESLint Configuration

- Parser: @typescript-eslint/parser
- Extends: ESLint recommended + TypeScript recommended + Prettier
- Rules: Strict type checking enabled

### Webpack Configuration

- Mode: Production
- Target: Web (browser)
- Output: UMD module format
- Library name: AXON
- Source maps enabled

## Development Workflow

1. **Write code** in `src/` directory
2. **Write tests** in `tests/` directory
3. **Run tests**: `npm test`
4. **Check linting**: `npm run lint`
5. **Format code**: `npm run format`
6. **Build**: `npm run build` (Node.js) or `npm run build:browser` (browser)

## Requirements Validation

This setup satisfies the following requirements from the AXON specification:

- **Requirement 2.4**: TypeScript support with full type definitions
- **Requirement 9.6**: TypeScript compilation in strict mode
- **Property-based testing**: fast-check installed and configured
- **Cross-platform**: Separate builds for Node.js and browser environments

## Next Steps

With the infrastructure in place, the next tasks are:
1. Implement TOON Serializer core (Task 2)
2. Implement TOON Parser (Task 3)
3. Implement Logger API (Task 6)
4. Implement File Manager (Task 8)

## Verification

To verify the setup is working correctly:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Check linting
npm run lint

# Build for Node.js
npm run build

# Build for browser
npm run build:browser
```

All commands should complete successfully with no errors.
