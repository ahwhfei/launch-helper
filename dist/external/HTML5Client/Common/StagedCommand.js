/**
 * Created by rajasekarp on 8/10/2016.
 */


var Utils;
(function(Utils) {
    var StagedCommands = (function () {
        function StagedCommands() {
            this.wait = true;
            this.commandQueue = [];
            this.commandHandler;
        }

        StagedCommands.prototype.stopWait = function() {
            for(var i =0; i <this.commandQueue.length ; i++) {
                console.log("Calling command handler for " + this.commandQueue[i]);
                callCommand.bind(this)(this.commandQueue[i]);
            }
            this.wait = false;
            this.commandQueue = [];
        };

        StagedCommands.prototype.startWait = function() {
            this.wait = true;
        };

        StagedCommands.prototype.set = function(command){
            if(this.wait){
                //console.log("Caching "+command+" for later");
                this.commandQueue.push(command);
            }else {
                //console.log("Calling command handler for " + command);
                callCommand.bind(this)(command);
            }
        };

        function callCommand(command){
            if(this.commandHandler) {
                this.commandHandler(command);
            }
        }

        StagedCommands.prototype.setCommandHandler = function (commandHandler) {
            this.commandHandler= commandHandler;
        };

        return StagedCommands;
    })();

    Utils.StagedCommands = StagedCommands;
})(Utils || ( Utils = {}));


/*

How to use...

(function () {
    var stagedCommands = new Utils.StagedCommands();
    stagedCommands.setCommandHandler(function (command) {
        console.log("Handling command " + command);
    });


    stagedCommands.set("1");
    stagedCommands.set("2");
    stagedCommands.set("3");

    stagedCommands.stopWait();

    stagedCommands.set("4");

})();*/