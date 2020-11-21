import React from 'react'
import { StreamsManager } from './../data/streams'
import { DocumentView } from './document-view'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.dataByRef = {}
    this.references = []
    this.state = {
      data: [],
    }
    this.handleNewVersion = this.handleNewVersion.bind(this)
    this.handleSnapshot = this.handleSnapshot.bind(this)
    this.getNext = this.getNext.bind(this)
    this.getPrevious = this.getPrevious.bind(this)
    this.streamsManager = new StreamsManager(this.handleSnapshot, this.handleNewVersion)
  }

  componentDidMount() {
    this.initializeDataPage()
  }

  async initializeDataPage(cursor) {
    // We will call our streams manager which will take care of error handling and
    // reconnecting and closing streams if necessary while at the same time providing us with updated data
    // via the callback we provided here. We do not need to initialize our data since Fauna's
    // streaming implementation will provide us with the data snapshot before it starts streaming updates.
    const results = await this.streamsManager.getDocumentsAndSubscribe(
      cursor,
      this.handleSnapshot,
      this.handleNewVersion
    )
    // Let's make sure we display the objects in the order we received them
    // yet can easily update them by reference.
    this.references = results.data
    this.references.forEach((ref) => {
      this.dataByRef[ref] = { current: {}, diffs: [], ref: ref }
    })

    this.before = results.before
    this.after = results.after
  }

  updateState() {
    const data = this.references.map((ref) => this.dataByRef[ref])
    this.setState({ data })
  }

  handleNewVersion(version) {
    this.dataByRef[version.document.ref].current = version.document.data
    if (version.diff.data) {
      // ignore diffs when no data has changed.
      this.dataByRef[version.document.ref].diffs.push({ diff: version.diff, document: version.document })
    }
    this.updateState()
  }

  handleSnapshot(snapshot) {
    // As an example we return the snapshot here and only show the element from,
    // the moment we retrieve the snapshot. You could just as well have
    // retrieved all data already and ignore the snapshot, only updating
    // the data with the versions.
    this.dataByRef[snapshot.ref].current = snapshot.data
    this.updateState()
  }

  getPrevious() {
    if (this.before) {
      this.initializeDataPage({ before: this.before })
    }
    else {
      toast.dark('This was the first page!');
    }
  }

  getNext() {
    if (this.after) {
      this.initializeDataPage({ after: this.after })
    }
    else {
      toast.dark('This was the last page!');
    }
  }

  render() {
    return <React.Fragment>
      <ToastContainer />
      <DocumentView
        data={this.state.data}
        getPrevious={this.getPrevious}
        getNext={this.getNext}
        streamsManager={this.streamsManager} />
    </React.Fragment>
  }

}

export default App
