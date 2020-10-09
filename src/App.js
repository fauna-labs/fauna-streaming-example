import React from 'react'
import { Client, query as q } from 'faunadb'

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      secret: '',
      collName: '',
      docID: '',
      subscription: null,
      events: []
    }

    this.secretChanted = this.secretChanted.bind(this)
    this.collNameChanged = this.collNameChanged.bind(this)
    this.docIDChanged = this.docIDChanged.bind(this)
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
  }

  render() {
    return (
      <div>
      <header><h1>FaunaDB - Streaming Demo</h1></header>
      <main>{this.mainView()}</main>
      </div>
    )
  }

  mainView() {
    if (!this.state.subscription) {
      return this.connectForm()
    }
    return this.updatesView()
  }

  updatesView() {
    return (
      <div>
        <h2>Events:</h2>
        <input type='submit' value='Disconnect' onClick={this.disconnect} />
        <ul>
          {this.state.events.map(event => {
            let str = JSON.stringify(event, null, 2)
            return <li key={str}><pre>{str}</pre></li>
          })}
        </ul>
      </div>
    )
  }

  connectForm() {
    return (
      <form onSubmit={this.connect}>
        <h2>Connect</h2>
        <label>
          Secret:
          <input type='text'
                 value={this.state.secret}
                 onChange={this.secretChanted} />
        </label>
        <br/>
        <label>
          Collection:
          <input type='text'
                 value={this.state.collName}
                 onChange={this.collNameChanged} />
        </label>
        <br/>
        <label>
          Document ID:
          <input type='text'
                 value={this.state.docID}
                 onChange={this.docIDChanged} />
        </label>
        <br/>
        <input type='submit' value='Connect' />
      </form>
    )
  }

  secretChanted(event) {
    this.setState({ secret: event.target.value })
  }

  docIDChanged(event) {
    this.setState({ docID: event.target.value }) }

  collNameChanged(event) {
    this.setState({ collName: event.target.value })
  }

  connect(event) {
    event.preventDefault()
    if (!this.state.secret || !this.state.collName || !this.state.docID)
      return

    let ref = q.Ref(
      q.Collection(this.state.collName),
      this.state.docID
    )

    let client = new Client({
      secret: this.state.secret,
      domain: 'db.fauna-preview.com'
    })

    let subscription = client.stream.document(ref)
      .on('snapshot', data => this.setState({ events: [...this.state.events, data] }))
      .on('version', data => this.setState({ events: [...this.state.events, data] }))
      .on('history_rewrite', (data, event) => this.setState({ events: [...this.state.events, event] }))
      .on('error', data => this.setState({ events: [...this.state.events, data] }))
      .start()

    this.setState({ subscription })
  }

  disconnect() {
    this.state.subscription.close()
    this.setState({
      subscription: null,
      events: []
    })
  }
}

export default App
