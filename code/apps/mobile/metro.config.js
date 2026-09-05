const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 3. Keep hierarchical lookup enabled. pnpm stores transitive dependencies
// beside each package under .pnpm; disabling this makes valid Expo dependencies
// such as whatwg-fetch invisible to Metro.

// 4. Mock native-only packages for web platform
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && (moduleName === "react-native-maps" || moduleName.startsWith("react-native-maps/"))) {
    return {
      filePath: path.resolve(projectRoot, "src/mocks/react-native-maps.web.tsx"),
      type: "sourceFile",
    };
  }
  // react-native-gesture-handler gọi findNodeHandle nội bộ, không hỗ trợ web.
  // Dùng stub web để tránh crash.
  if (platform === "web" && (moduleName === "react-native-gesture-handler" || moduleName.startsWith("react-native-gesture-handler/"))) {
    return {
      filePath: path.resolve(projectRoot, "src/mocks/react-native-gesture-handler.web.tsx"),
      type: "sourceFile",
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
