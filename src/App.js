import React from 'react'
import { Client, query as q } from 'faunadb'
require('dotenv').config()

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      secret: process.env.REACT_APP_FAUNADB_KEY || '' ,
      collName: process.env.REACT_APP_FAUNADB_COLLECTION || '',
      subscription: null,
      events: []
    }

    this.secretChanted = this.secretChanted.bind(this)
    this.collNameChanged = this.collNameChanged.bind(this)
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
  }

  setStateAndLog(logText, state) {
    console.log(logText, state)
    return this.setState(state)
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

        <input type='submit' value='Connect' />
      </form>
    )
  }

  secretChanted(event) {
    this.setStateAndLog('secret changed', { secret: event.target.value })
  }

  collNameChanged(event) {
    this.setStateAndLog('collname changed', { collName: event.target.value })
  }

  connect(event) {
    console.log('connect')
    event.preventDefault()
    if (!this.state.secret || !this.state.collName) {
      console.error('please make sure a secret and collName is set')
      return
    }

    let client = new Client({
      secret: this.state.secret,
      domain: 'db.fauna-preview.com',
      fetch: fetch
    })

    return client.query(
      q.Paginate(q.Documents(q.Collection(this.state.collName)), { size: 99})
    ).then((refs => {
      refs.data.forEach((ref) => {
        client.stream.document(ref)
          .on('start', data => this.setStateAndLog('start', { events: [...this.state.events, data] }))
          .on('snapshot', data => this.setStateAndLog('snapshot', { events: [...this.state.events, data] }))
          .on('version', data => this.setStateAndLog('version', { events: [...this.state.events, data] }))
          .on('history_rewrite', (data, event) => this.setStateAndLog('history_rewrite', { events: [...this.state.events, event] }))
          .on('error', data => this.setStateAndLog('error', { events: [...this.state.events, data] }))
          .start()

      })
    }))
    .catch((err) => {
      console.error(err)
    })


  }

  disconnect() {
    this.state.subscription.close()
    this.setStateAndLog('disconnect', {
      subscription: null,
      events: []
    })
  }
}

export default App
