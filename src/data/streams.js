
import { toast } from 'react-toastify';
import { Client, query as q } from 'faunadb'
const { Paginate, Documents, Collection } = q
require('dotenv').config()


export class StreamsManager {
    constructor(guiHandleSnapshot, guiHandleVersion) {
        // Example with pagination, play with the pages to open more or less streams.
        this.PAGESIZE = 10
        this.page = 1;
        // Initialize client domain and scheme can be omitted, they are
        // added for convenience in case you are working with a docker image or connecting to another
        // environment (e.g. preview)
        this.client = new Client({
            secret: process.env.REACT_APP_FAUNA_SECRET,
            domain: process.env.REACT_APP_FAUNA_DOMAIN || 'db.fauna.com',
            scheme: process.env.REACT_APP_FAUNA_SCHEME || 'https'
        })
        this.subscriptionsByRef = {}
        this.handleStart = this.handleStart.bind(this)
        this.handleSnapshot = this.handleSnapshot.bind(this)
        this.handleVersion = this.handleVersion.bind(this)
        this.handleHistoryRewrite = this.handleHistoryRewrite.bind(this)
        this.handleError = this.handleError.bind(this)
        this.guiHandleSnapshot = guiHandleSnapshot
        this.guiHandleVersion = guiHandleVersion
    }

    async getDocumentsAndSubscribe(cursor) {

        // Before we get a new set of documents (e.g. the next page), we will close down existing streams
        this.closeStreams()
        // First we will get all the document references.
        const page = await this.getDocuments(cursor)
        this.openStreams(page.data)
        // We will return the references to the UI so it knows what to update.
        return page
    }

    async getDocuments(cursor) {
        // Retrieve a page of data
        const options = cursor || {}
        if (options.after) {
            this.page++
        }
        if (options.before) {
            this.page--
        }
        options.size = this.PAGESIZE
        return await this.client.query(
            Paginate(Documents(Collection(process.env.REACT_APP_FAUNA_COLLECTION)), options)
        )
    }

    openStreams(documentReferences) {
        console.log('data retrieved', documentReferences.length)
        documentReferences.forEach((ref) => {
            // Open the subscription and start it. We can keep the default fields
            // or specify them ourselves
            //    action:      the action that triggered the event
            //    document:    the document's new data
            //    prev:        the document's old data (optional)
            //    diff:        the diff between old and new data (optional)
            // Let's just add all of them for the sake of demonstration :)
            const documentStream = this.client.stream.document(ref,
                { fields: ["action", "document", "prev", "diff"] }
            )

            // We'll save some extra data along with the stream so let's place it in an object.
            const streamAndData = {
                stream: documentStream
            }
            // We can then define our callbacks, which will receive 'event' and 'data'
            // parameters, event contains information about the event such as the type of event
            // and the transaction timestamp and includes the data,
            // data only contains the data.
            documentStream
                .on('start', (data, event) => this.handleStart(streamAndData, data, event))
                .on('snapshot', (data, event) => {
                    this.handleSnapshot(streamAndData, data, event)
                    this.guiHandleSnapshot(data)
                })
                .on('version', (data, event) => {
                    this.handleVersion(streamAndData, data, event)
                    this.guiHandleVersion(data)
                })
                .on('history_rewrite', (data, event) => this.handleHistoryRewrite(data, event))
                .on('error', (data, event) => this.handleError(streamAndData, data, event))
            // and start the stream
            documentStream.start()
            this.subscriptionsByRef[ref] = streamAndData
            // we'll return it so we have a reference to the stream to close it later on.
        })
    }

    handleStart(streamAndData, data, event) {
        // Keeping the start time of the stream, purely informational, we won't use it.
        streamAndData.start = data
    }

    handleSnapshot(streamAndData, data, event) {
        // We'll keep the snapshot as well. The snapshot is useful in case you plan to apply changs
        // incrementally. Instead of retrieving the data and then opening a stream,
        // we can use the snapshot to make sure we have not missed an update.
        console.log(data)
        streamAndData.snapshot = data
    }

    handleVersion(streamAndData, data, event) {
        // We'll keep the last timestamp of the document.
        streamAndData.last = data.document.ts
    }

    handleHistoryRewrite(data, event) {
        // Fauna allows to rewrite history, if you occasionally do rewrite history (e.g. to fix historic data errors)
        // then it's a good idea to subscribe on this event and restart the stream for that document
        // since a history rewrite can potentially change how the document looks today.
        console.log('history rewrite, restarting stream', data, event)
        // Hint, try using the dashboard shell to change history of a document, to see the result.
        //   Insert(
        //     Ref(<a document reference>, Now(), 'create', { data: { name: "haha, history changed! "}}
        //   )
        this.restartDocumentStream(data.document.ref)
        toast.warn(' History changed, restarting stream ', { autoClose: 5000, });
    }

    handleError(streamAndData, data, event) {
        // In the case of an error, we're going to print the error and
        //  restart the stream for that document.
        console.log('error, restarting stream', data, event, streamAndData)
        this.restartDocumentStream(streamAndData.snapshot.ref)
    }

    restartDocumentStream(ref) {
        // let's fetch the stream subscription
        const streamAndData = this.subscriptionsByRef[ref]
        // close it
        streamAndData.stream.close();
        // and restart it again, we will wait slightly
        setTimeout(() => {
            this.openStreams([ref])
        }, 100)
    }

    closeStreams() {
        // If we change a page, we'll close all the streams to release the
        // underlying connections that the stream uses.
        Object.keys(this.subscriptionsByRef).forEach((ref) => {
            const streamAndData = this.subscriptionsByRef[ref]
            console.log('closing stream', streamAndData.stream)
            streamAndData.stream.close();
        })
        this.subscriptionsByRef = {}
    }
}
