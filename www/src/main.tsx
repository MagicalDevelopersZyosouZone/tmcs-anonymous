import { TMCSConsole } from "./console";
import ReactDOM from "react-dom";
import React from "react";
import { TMCSAnonymousUI } from "./tmcs-ui";
import TMCSAnonymous from "tmcs-anonymous";

TMCSConsole();
async function main()
{
    const tmcs = new TMCSAnonymous(window.location.toString());
    await tmcs.generateKey();
    const element = (<TMCSAnonymousUI tmcs={tmcs}></TMCSAnonymousUI>);
    ReactDOM.render(element, document.querySelector("#root"));
    
}
main();