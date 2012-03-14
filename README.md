Chagama
========

![Chagama](http://www.japonisme-arts.com/items/828276/catphoto.jpg)

Git flow, GitHub and PivotalTracker, all in one teapot
------------------------------------------------------

**chagama** is a set of git command to be installed onto any system which
integrates the different tools used for development (along with git flow,
GitHub and PivotalTracker).

All commands are callabale by doing *git chagama* OR *chagama* directly.

** NOTE ** STILL UNDER HEAVY DEVELOPMENT. None of this is useable yet.

Available commands
-------------------

### chagama configure key value ###

Modify chagama configuration in locat git user config. Should not normally be required

### chagama clone [repo] ###

Clone the directory, make sure the link to PT is present (in package.json?), and create a local develop branch synced with the repos one.

### chagama show [storyId|current|new|refused] ###

Show the current repository storylist, or a stories tasks. current shows the currently started story task list

### chagama start storyId ###

Create a story (if it does not exist) branch from develop, then switch to it; mark it as start in PT. unstarted and refused tasks will be shown distinctively

### chagama stop ###

Switch to the develop branch.

### chagama check taskId ###

Triggers a commit. If the commit succeed, we mark the task as checked in PT

### chagama uncheck taskId ###

Uncheck a given task in PT. Do not reverse the commit.

### chagama finish storyId ###

Triggers a commit. If the commit succeed, we mark the story as finished,
create a pull request for the feature branch, post it to PTs task as comment and switch to the develop branch.

### chagama pending [storyId] ###

show the current project pending pull requests, or a specific story request.

### chagama verify storyId ###

create a storie branch and run the pull request diff file.

### chagama deliver [comment] ###

commit the current pull request, merge to develop, mark as delivered in PT, push to git blessed and do a pull on the test environment

### chagama refuse [comment] ###

Put the task as refused in PT

### chagama publish [versionNumber] [commitId] ###

merge to master and create a tag with the given version number, or an incremented minor version

### chagama launch [versionNumber] ###

(not implemented)

Requirements
-------------

* [Node.js]
* [gitflow]

[gitflow]: https://github.com/nvie/gitflow
[Node.js]: http://nodejs.org/
