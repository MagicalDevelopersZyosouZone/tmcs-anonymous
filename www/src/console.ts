import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";
import tmcs_msg from "./proto/tmcs_msg_pb";
import { waitWebSocketMessage, waitWebsocketOpen, readBlob, waitWebSocketBinary } from "./util";
import TMCSAnonymous from "../lib/tmcs-anonymous/dist/tmcs-anonymous/src";

export async function TMCSConsole()
{
    const tmcs = new TMCSAnonymous(window.location.toString());
    (window as any).openpgp = openpgp;
    (window as any).tmcs = tmcs;
    (window as any).genKey = async () =>
    {
        const [pubkey, prvkey] = await tmcs.generateKey();
        console.log(pubkey.armor());
        console.log(prvkey.armor());
        return [pubkey, prvkey];
    };
    (window as any).signup = async () =>
    {
        const result = await tmcs.registerKey();
        console.log(result);
        return result;
    };
    (window as any).connect = async () =>
    {
        await tmcs.connect();
        tmcs.onContactRequest = (usr) =>
        {
            console.log(`[Notice] Received a contact request from {${usr.fingerprint}}`);
            console.log(usr.pubkey.armor());
            console.log(`\tCall 'accept()' to accept this request, Call 'reject()' to reject it.`);
            return new Promise((resolve) =>
            {
                (window as any).accept = () =>
                {
                    console.log("Accepted.");
                    resolve(true);
                    (window as any).accept = null;
                    (window as any).reject = null;
                }
                (window as any).reject = () =>
                {
                    console.log("Rejected.");
                    resolve(false);
                    (window as any).accept = null;
                    (window as any).reject = null;
                }
            });
        }
        tmcs.onNewSession = (session) =>
        {
            console.log(`[Notice] A new session created.`);
            session.onmessage = async (message) =>
            {
                await message.decrypt(tmcs.user.prvkey, tmcs.contacts.get(message.sender).pubkey);
                if (message.verified)
                {
                    console.log(`{${message.sender}} - ${message.time.toTimeString()} - verified: `);
                    console.log(`\t${message.body}`);
                }
                else
                {
                    console.log(`{${message.sender}} - ${message.time.toTimeString()} - not verified: `);
                    console.log(`\t${message.body}`);
                }

                (window as any).send = async (text: string) =>
                {
                    await session.send(text);
                }
            }
            (window as any).send = async (text: string) =>
            {
                await session.send(text);
            }
        };
        console.log(tmcs.state);
    }
    (window as any).quickStart = async() =>
    {
        await tmcs.generateKey();
        console.log(await tmcs.registerKey());
        (window as any).connect();
    }

    (window as any).quickJoin = async () =>
    {
        await tmcs.generateKey();
        let pubkey = await tmcs.registerKey();
        (window as any).pubkey = pubkey;
        (window as any).connect();
        await tmcs.contactRequest(pubkey);
    }
    (window as any).help = () =>
    {
        console.log(`TMCS Anonymous@console

    genkey()            Generate a new PGP key pair.
    signup()            Sign up your public key to TMCS Anonymous server.
    connect()           Connect to TMCS Anonymous server.
    quickStart()        One call to TMCS Anonymous.
    quickJoin()         One call to join a session.
    help()              Get help.
    version()           Get the version.
`);
    }
    console.log(`
 __________ _____   _____    ________ ________
/___   ___//     | /     |  /  _____//  _____/
   /  /   /  /|  |/  /|  | /  /____ /_____  /
  /__/   /__/ |_____/ |__|/_______//_______/    Anonymous @ console

Powered by mdzz.studio

`);
    console.log("System Ready.");
    console.log("Call 'help()' for help.");
}