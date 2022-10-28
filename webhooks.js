/**
* Add folder dynamicly
* Add support for headers
* Protect routes from spam
*/

// Deps //
const { exec } = require("child_process");
const express = require("express");
const gatsbyWebhookHelper = express();
gatsbyWebhookHelper.use( express.json() );

// Config //
const WEBHOOK_PORT = 9000;
var ongoing_process = false;
const folder = "cd /var/www/html/ext_up_creilab_web;";

// Gatsby Update/Re-build sequences //
const cleanRebuildSequence = [
    "yarn clean",
    "yarn build",
    "rsync -azP public/* public_html",
//    "cd /var/www/html/ext_up_creilab_web; yarn build"
    // Add custom commands here
];
const quickRebuildSequence = [
    "cd /var/www/html/ext_up_creilab_web; yarn build"
    // Add custom commands here
];
// You can also create your custom callback terminal sequences...

// Routing (Gatsby Update/Re-build sequences) //
// Default delay is 120 and 30s respectively = build will trigger only after inactivity for 2 minutes, to not to repeat the same thing multiple times.
createGatsbyWebhook('/clean_gatsby_rebuild/', cleanRebuildSequence, 1000)
createGatsbyWebhook('/quick_gatsby_rebuild/', quickRebuildSequence, 300)
// You can also create custom webhook callbacks with your custom sequences...

// FUNCTIONS //

/* FUNCTION: Create Gatsby webhook route.
    endpoint(string) "/test/" - endpoint path
    sequence(array) [string, ...] - callback commands, will be executed synchronously in order, same as "commands" in runSequence()
    delay(int) - delay in ms. The action will be fired only after inactivity of receiving the same request within delay period.
*/
function createGatsbyWebhook(endpoint, sequence, delay = 15000){
    gatsbyWebhookHelper.post( endpoint, ( req, res ) => {
        if(ongoing_process === false) {
            console.log("Initializing a Webhook sequence.");
            ongoing_process = true;
            console.log("Countdown of "+delay+"ms started...");
            setTimeout(()=>{runSequence(sequence)}, delay);
            res.sendStatus( 200 );
        } else {
            console.log ('Sorry, already running a sequence. Try again in few minutes.');
        }
    });
}

/* FUNCTION: Run Terminal Sequence.
    commands(array) [string, ...] - callback commands, will be executed synchronously in order.
*/
function runSequence (commands=false){
    if(commands === false) return false;
    var commandArr = [...commands];
    let newCommand = folder + commandArr[0];
    commandArr.shift();
    console.log('Running "'+newCommand+'"');
    // Execute terminal command
    if (!newCommand || newCommand.trim() === "") return false;
    exec(String(newCommand), (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);

        // Recursive continuation
        if (commandArr.length>0) {
            runSequence(commandArr);
        } else {
            // declare finished process after completed sequence
            ongoing_process = false;
            console.log("Webhook callback sequence Completed.");
        }
    });
    return true;
}

// Start //
function start_gatsby_webhook_listener(){
    gatsbyWebhookHelper.listen( WEBHOOK_PORT, () => console.log( 'Node Webhook helper started on port '+String(WEBHOOK_PORT) ) );
}
start_gatsby_webhook_listener();
