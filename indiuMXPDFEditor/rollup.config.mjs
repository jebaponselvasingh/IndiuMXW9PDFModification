import json from "@rollup/plugin-json";

export default args => {
    // pluggable-widgets-tools provides a base config in args.configDefaultConfig
    const result = args.configDefaultConfig;
    return result.map((config) => {
        config.plugins = [...(config.plugins || []), json()];
        return config;
    });
};
