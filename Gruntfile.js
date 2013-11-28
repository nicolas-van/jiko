module.exports = function(grunt) {

    var pack = require("./package.json");

    grunt.initConfig({
        jshint: {
            files: ['jiko.js', 'test.js', 'jiko_cli.js', 'test_cli.js'],
            options: {
                es3: true, // ie 7 compatibility
                eqeqeq: true, // no == or !=
                immed: true, // forces () around directly called functions
                forin: true, // makes it harder to use for in
                latedef: "nofunc", // makes it impossible to use a variable before it is declared
                newcap: true, // force capitalized constructors
                strict: true, // enforce strict mode
                trailing: true, // trailing whitespaces are ugly
                maxlen: 120, // maximum characters per line
                camelcase: true, // force camelCase
            },
        },
        mocha: {
            main: {
                src: ['test.html'],
                options: {
                    log: true,
                    reporter: "Nyan",
                    run: true,
                },
            }
        },
        mochaTest: {
            main: {
                src: ['test.js', 'test_cli.js'],
                options: {
                }
            }
        },
        shell: {
            compileTest1: {
                command: "./jiko_cli.js compile ./test_templates/exfunction.html",
            },
            compileTest2: {
                command: "./jiko_cli.js compile ./test_templates/exmodule.html",
            },
        },
        clean: {
            tests: {
                src: ["test_templates/*.js"],
            }
        },
        compress: {
            main: {
                options: {
                  archive: pack.name + "-" + pack.version + ".zip",
                },
                files: [
                    {src: 'jiko.js', dest: '.'},
                    {expand: true, flatten: true, src: 'bower_components/underscore/underscore.js', dest: '.'},
                    {src: 'README.md', dest: '.'},
                    {src: 'package.json', dest: '.'},
                ],
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask("nodeTest", ["mochaTest"]);
    grunt.registerTask("compileTests", ["shell:compileTest1", "shell:compileTest2"]);
    grunt.registerTask("browserTest", ["compileTests", "mocha", "clean:tests"]);
    grunt.registerTask('test', ['jshint', "nodeTest", "browserTest"]);

    grunt.registerTask('dist', ['compress']);

    grunt.registerTask('default', ['test']);

};
