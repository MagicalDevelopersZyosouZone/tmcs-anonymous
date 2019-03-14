const path = require("path");

module.exports = {
    // mode:"production",
    entry: {
        main: "./www/src/main.ts",
    },
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "www/dist/script"),
        filename: "[name].bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    }
};
