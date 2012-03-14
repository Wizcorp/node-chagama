var colors      = require("colors"),
    pivotal     = require("pivotal"),
    inireader   = require("inireader"),
    cp          = require("child_process"),
    prompt      = require("prompt");

module.exports = chagama = {
    "pivotal"       : pivotal,
    "userConfig"    : null,
    "repoConfig"    : null,
    "showHelp"      : function(cmd){ this.commands.help.func(cmd); },
    "showSign"      : function(){

            console.log(" ");
            console.log(" φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ ".blue.bold);
            console.log("  Chagama / Git flow, GitHub and PivotalTracker, all in one teapot".grey);
            console.log(" φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ φ ".blue.bold);
    },
    "loadRepoConfig" : function(){
        // Get the Git repository config file
        try{
            var ini = new inireader.IniReader();
            ini.load("./.git/config");
            return ini;
        }
        catch(e){
            console.log(" ");
            console.log(" ", "✖ This does not seem to be the top of a git repository! Exiting".red);
            console.log(" ");
            return;
        }

    },
    "commands" : {
        "configure" : {
            "desc" : "Configure how chagama works on your environment",
            "args" : {
                "key" : {
                    "desc" : "Key to view / modify",
                 },
                "value" : {
                    "desc"      : "New value for the given key",
                    "optional"  : true,
                 },
             },
             "func" : function(key, value){
             }
         },
         "setup" : {
            "desc" : "Setup the link between you git repository and PivotalTracker",
            "args" : {
             },
             "func" : function(){

                var setup = null,
                    getProjects = null,
                    ini = chagama.loadRepoConfig();

                // If we are already linked, we ask what to do
                // We can reset or exit
                if(ini.pivotal){
                    console.log(" ");
                    console.log(" ", "! Project is already linked to PivotalTracker. Relink?");
                    prompt.start();
                    prompt.get(["relink"], function(err, ret){

                        if(ret.relink !== "y")
                            return;

                        setup();
                    });
                }
                else setup();

                // To do our setup, we ask the use what project the user whishes to link to.
                // So we get the current available list of projects
                setup = function(){
                    pivotal.getProjects(getProjects);
                };

                getProjects = function(err, ret){

                    var projects = null,
                        p = null,
                        c = 1;

                    // Return value might not be an array...
                    projects = ret.project.length ? ret.project : [ret.project];

                    if(err){
                        console.log(" ", "✖ Could not retrieve your PT project list!".red);
                        console.err(err);
                        return;
                    }

                    // List in humand readable the list of projects
                    // Plus an extra option at the bottom to create a new
                    // Project if the current project is new
                    console.log(" ");
                    console.log(" ", "Select which PivotalTracker project you wish to link this Git repository to:".grey);
                    console.log(" ", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n".blue.bold);

                     for(p in projects){
                         console.log(" ", c.toString().green + ")".grey, projects[p].name.magenta);
                         c += 1;
                     }

                     console.log(" ", "n".green + ")".grey, "Create a new project on PT and attach it to this".magenta);
                     console.log(" ");

                    // Prompting for a selection which must be within the boundaries
                    // Of what we are asking above (either a project or new)
                     prompt.start();
                     prompt.get([{
                         name       : "projectNumber",
                         validator  : function(v){ return (v <= c && v >= 1) || v === "n"; },
                         empty      : false,
                         warning    : "Please provide a number or n for a new project",
                     }], function(err, ret){

                        if(err){
                            console.log(" ", "✖ Could not retrieve your answer".red);
                            console.log(" ", err);
                            return;
                        }

                        var projectNumber = ret.projectNumber,
                            setReposProject = function(project){
                                ini.pivotal
                            };

                        // If new, we create the project by asking for its details
                        if (projectNumber === "n") {

                            console.log(" ");
                            console.log(" ", "New project: please enter new project name and iteration duration:".grey);
                            console.log(" ", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n".blue.bold);
                            prompt.get([{
                                name    : "name",
                                empty   : false,
                                warning : "Project name is required",
                            },
                            {
                                name        : "iteration_length",
                                validator   : /[0-9]+/,
                                empty       : false,
                                warning     : "Please provide a valid number for the desired iteration lenght",
                            }], function(err, ret){

                                if(err){
                                    console.log(" ", "✖ Could not retrieve your answer".red);
                                    console.log(" ", err);
                                    return;
                                }

                                pivotal.addProject({
                                    name             : ret.name,
                                    iteration_length : ret.iteration_length,
                                    no_owner         : false
                                }, function(err, ret){

                                    var  project = ret;

                                    if(err){
                                        console.log(" ", "✖ Could not create a new project!".red);
                                        console.log(err);
                                        return;
                                    }

                                    // We do not have an error
                                    // We will add the current user to the list of
                                    // owners for this project

                                    pivotal.addMembership(project.id, {
                                        "role"  : "owner",
                                        "person" : {
                                            "name"      : chagama.userConfig.name,
                                            "initials"  : chagama.userConfig.initials,
                                            "email"     : chagama.userConfig.email
                                        }
                                    }, function(err, ret){
                                        return setReposProject(project);
                                    })
                                });
                            })
                        }
                        else {
                            return setReposProject(projects[projectNumber-1]);
                        }
                    });
                 };
             }
         },
         /**
            - Summary of operation -

            git clone;
            git flow init;
            pivotal: link to project;
         */
         "clone" : {
            "desc" : "Clone an application and create the required branches (develop)",
            "args" : {
                "repository" : {
                    "desc" : "The Git repository you wish to clone",
                }
             },
             "func" : function(repository){

                console.log(" ");
                console.error("  Cloning repository ".magenta + repository.green + "...".magenta);
                console.log(" ");

                var cloneProc = cp.spawn("git", ["clone", repository]);

                cloneProc.stdout.on("data", function(data){
                    console.log(("  ✔ " + data).green);
                });

                cloneProc.stderr.on("data", function(data){
                    console.error(("  ✖ " + data).red);
                });

                cloneProc.on("exit", function(err, signal){
                    if(err){
                        console.error(("  ✖ Error " + err + ":" + signal).red);
                        chagama.commands.clone.func();
                    }
                });
             }
         },
         /**
            - Summary of operation -

            pivotal: list the current available stories;
         */
         "show" : {
            "desc" : "Show a list of stories",
            "args" : {
                "(storyId|current|new|chores|bugs|stories|refused|mine|all|unassigned|labelName)" : {
                    "desc"      : "Select to show a single story or filter by new, refused, only mine or by tagName.",
                    "optional"  : true,
                }
             },
             "func" : function(filter){
                 if(filter){
                     if(Math.parseInt(filter) == filter){
                         pivotal.getStory(repoConfig.projectId, filter, function(err, ret){
                             console.log(ret);
                         });
                     }
                     else{
                         pivotal.getStories(repoConfig.projectId, filter, function(err, ret){
                             console.log(ret);
                         });
                     }
                 }
             }
         },
         /**
            - Summary of operation -

            pivotal : get a story
            git flow start pivotal_storyid
            pivotal: present a list of the tasks to be done
        */
         "start" : {
            "desc" : "Start a new story / chore / bug",
            "args" : {
                "storyId" : {
                    "desc"      : "The story you wish to start. If not given, an interactive shell ask you which story to select from your list.",
                    "optional"  : true,
                }
             },
             "func" : function(storyId){
                 var startTask = function(storyId){
                 };

                 if(storyId){
                     pivotal.getStory(projectId, storyId, function(err, ret){

                        if(err){
                        }

                        startTask(storyId);
                     });
                 }
                 else {
                    pivotal.getStories(projectId, function(err, ret){

                        var stories = ret.story;

                        if(err){
                        }

                        prompt.start();

                        // List in humand readable the list of projects
                        // Plus an extra option at the bottom to create a new
                        // Project if the current project is new
                        console.log(" ");
                        console.log(" ", "Select which PivotalTracker story you wish to start:".grey);
                        console.log(" ", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n".blue.bold);

                         for(p in stories){
                             console.log(" ", c.toString().green + ")".grey, stories[p].name.magenta);
                             c += 1;
                         }

                         console.log(" ", "n".green + ")".grey, "Create a new story in PT and start it".magenta);
                         console.log(" ");

                         prompt.get([{
                             name       : "projectNumber",
                             validator  : function(v){ return (v <= c && v >= 1) || v === "n"; },
                             empty      : false,
                             warning    : "Please provide a number or n for a new story",
                         }], function(err, ret){
                            startTask(storyId);
                         });
                    });
                 }
             }
         },
         /**
            - Summary of operation -

            pivotal : get the current story's task list
            pivotal : check the tasks which are now completed
            git commit (inject the tasks in the commit log automatically)

        */
         "commit" : {
            "desc" : "Commit to the story branch, and mark a task within the current story as done",
            "args" : {
                "taskId" : {
                    "desc"      : "The task you wish to mark as done. If not given, an interactive shell ask you which task to select from your list.",
                    "optional"  : true,
                }
             },
             "func" : function(taskId){
             }
         },

        /**
            - Summary of operation -

            npm/node : run unit tests specified in the package.json

            if pass all

            git commit (inject the tasks in the commit log automatically)
            pivotal: change task status to delivered
            git create-pull-request
            pivotal: upload pull request as file

        */
         "finish" : {
            "desc" : "Commit, create a pull request for the current story and reflect the changes on PT",
             "func" : function(){
             }
         },
        /**
            - Summary of operation -

            pivotal: getStories (status finished)
        */
         "pending" : {
            "desc" : "Retrieve pending pull requests to be approved",
            "args" : {
                "storyId" : {
                    "desc"      : "If specified, see the story in more details",
                    "optional"  : true,
                }
             },
             "func" : function(storyId){
             }
         },
        /**
            - Summary of operation -

            pivotal: getStories (status finished)
            select a story
            pivotal: getStory
            git flow feature check_pivotal_id
            select latest diff attachement
            download
            apply as patch to current feature branch
        */
         "verify" : {
            "desc" : "Create a local story branch and put the pull request content in it for code reviewing (for team leaders)",
            "args" : {
                "storyId" : {
                    "desc"      : "The story you wish to verify. If not given, an interactive shell ask you which story to select from your list.",
                    "optional"  : true,
                }
             },
             "func" : function(storyId){
             }
         },
         /**
            - Summary of operation -

            pivotal: change story status to delivered
            pivotal: add message (note) in regards to the refusal
            git flow feature -d pivotal_storyid

         */
         "deliver" : {
            "desc" : "Deliver the pull request. Merges the story branch to the develop branch, then push it on your blessed repository and notify PT.",
             "func" : function(){
             }
         },
         /**
            - Summary of operation -

            pivotal: change task status to open
            pivotal: add message (note) in regards to the refusal
            git flow feature -d pivotal_storyid

         */
         "refuse" : {
            "desc" : "Destroy the local verification branch, and mark the story as refused.",
             "func" : function(){
             }
         },
         /**
            - Summary of operation -

            pivotal : get next release informations
            git flow release someversionnumber
         */
         "release" : {
            "desc" : "Create a code release through an interactive shell. Take the version number from PT, and create a tag in you git repository after mergin develop code to master from develop",
             "func" : function(){
             }
         },
         /**
            - Summary of operation -

            Move the production tag from its current position to the next

            git tags -d production
            git tags production
            git push
         */
         /* "launch" : {
            "desc" : "Launch a version of the application using an interactive shell (coming soon). Move the production tag to it",
            "args" : {
                "version" : "What version to launch (default: current highest version)",
                "tagname" : "To which tag are we launching? (default production)"
             },
             "func" : function(){
                console.log("This command is not available in this version. Come back soon for more!");
                return;
             }
         },*/
         /**
            - Summary of operation -

            Start a shell where you can type commands.
            Create a pubsubhubub client connection to github
            Update the user with what is happening
         */
         "console" : {
            "desc" : "Launches in console mode: you will then get live update in regards to the projects you are currently working on",
            "func" : function(){
            }
         },
         /**
            - Summary of operation -

            Create a pubsubhubub client connection to github
            When an update fits a certain setup (i.e. a tag we are listening to just changed position),
            deploy a given launch procedure
        */
         "drone" : {
            "desc" : "Launches in console mode: you will then get live update in regards to the projects you are currently working on",
            "func" : function(){
            }
         },
         "help" : {
            "desc" : "Show help content",
            "args" : {
                "command" : {
                    "desc"      : "Detailed help for this command",
                    "optional"  : true,
                }
             },
             "func" : function(cmd){

                var commands = module.exports.commands;

                if(cmd){
                    if(!commands[cmd]){
                        console.log(("No help available for command: " + cmd).red);
                    }
                    else{
                        console.log("");
                        console.log("  " + cmd.green + " : " + commands[cmd].desc.magenta);
                        console.log("");
                        console.log(" ", "Arguments:".green.underline);
                        console.log("  ");

                        for(var a in commands[cmd].args){
                            console.log("    " + a.green.bold + (commands[cmd].args[a].optional ? " (optional)".grey : "") + " : " + commands[cmd].args[a].desc.magenta);
                        }
                        console.log("");

                        return;
                    }
                }

                console.log("");

                for(var c in commands){
                    console.log("  " + c.green.bold + "   \t\t" + commands[c].desc.magenta);
                }
                console.log("");

                return true;
             }
         },
    }
};
