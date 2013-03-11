

var program = require('commander');
var jiko = require('./jiko');

program.version('0.7.0');


program.command('compile <file>')
    .description('Compile a Jiko template file to a javascript file.')
    .option('-o, --output', 'Do not automatically write file, outputs in console instead.')
    .action(function(env){
        var file = program.args[0];
        
    });

program.parse(process.argv);

