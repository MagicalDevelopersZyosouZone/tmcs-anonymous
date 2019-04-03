import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";
import tmcs_msg from "./proto/tmcs_msg_pb";
import { waitWebSocketMessage, waitWebsocketOpen, readBlob, waitWebSocketBinary } from "./util";
import TMCSAnonymous from "../lib/tmcs-anonymous";

const host = "localhost:5325";
(window as any).openpgp = openpgp;

async function TMCSConsole()
{
    const tmcs = new TMCSAnonymous(window.location.toString());
    (window as any).tmcs = tmcs;
    (window as any).genKey = async () =>
    {
        const [pubkey, prvkey] = await tmcs.generateKey();
        console.log(pubkey.armor());
        console.log(prvkey.armor());
        return [pubkey, prvkey];
    };
    (window as any).register = async () =>
    {
        const result = await tmcs.registerKey();
        console.log(result);
        return result;
    }
    (window as any).connect = async () =>
    {
        await tmcs.connect();
        console.log(tmcs.state);
    }
    (window as any).startReceive = () =>
    {
        tmcs.onContactRequest = (usr) =>
        {
            console.log(`Received a contact request from {${usr.fingerprint}}`);
            console.log(usr.pubkey.armor());
            console.log(`Call 'accept()' to accept this request, Call 'reject()' to reject it.`);
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
            console.log(`A new session created.`);
            session.onmessage = async(message) =>
            {
                await message.decrypt(tmcs.user.prvkey, tmcs.contacts.get(message.sender).pubkey));
                if (message.verified)
                {
                    console.log(`{${message.sender}} - ${message.time.toTimeString()} - verified: `);
                    console.log(message.body);
                }
                else
                {
                    console.log(`{${message.sender}} - ${message.time.toTimeString()} - not verified: `);
                    console.log(message.body);
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
    };
    (window as any).create = async() =>
    {
        await tmcs.generateKey();
        console.log(await tmcs.registerKey());
        await tmcs.connect();
        (window as any).startReceive();
    }

    (window as any).join = async () =>
    {
        await tmcs.generateKey();
        let pubkey = await tmcs.registerKey();
        (window as any).pubkey = pubkey;
        await tmcs.connect();
        (window as any).startReceive();
        await tmcs.contactRequest(pubkey);
    }
    console.log("TMCS Anonymous@console");
    console.log("Ready.");
}
TMCSConsole();