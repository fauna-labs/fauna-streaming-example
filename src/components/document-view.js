import React from 'react'
import documentIcon from './../images/document.png';
import './document-view.css';

export class DocumentView extends React.Component {
    constructor(props) {
        super(props);
        this.getPrevious = props.getPrevious;
        this.getNext = props.getNext;
        this.streamsManager = props.streamsManager;
        this.selectDiffDot = this.selectDiffDot.bind(this)
        this.state = {
            data: this.props.data
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ data: nextProps.data });
    }

    render() {
        return <div className='documents-view'>
            <div className='title'>
                <h1> Live updating documents </h1>
                Below is an overview of a page of products that changes live when you make a change in your Fauna database.<br />
                When you move to the next page, the streams will be closed and new streams will be opened for the new page.<br />
                The current page size is set to {this.streamsManager.PAGESIZE}. <br />
                <br /> Each box represents a document in your collection. Each bullet represents an incoming event, click on one of the bullets to see the diff.
            </div>
            <div className='documents-page'>
                {this.renderDocuments()}
            </div>
            <div className='links'>
                <a className="button" onClick={this.getPrevious}>previous</a>
                <div className='current-page'> Page {this.streamsManager.page}</div>
                <a className="button" onClick={this.getNext}> next</a>
            </div>
        </div >
    }

    selectDiffDot(diffAndDoc) {
        this.state.data.forEach((currentAndDiff) => {
            currentAndDiff.diffs.forEach((diffAndDoc) => {
                diffAndDoc.selected = false
            })
        })
        diffAndDoc.selected = true

        this.setState(this.state);
    }

    renderDocuments() {
        return this.state.data.map((currentAndDiff) => {
            return this.renderDocumentLine(currentAndDiff)
        })
    }

    renderDocumentLine(currentAndDiff) {
        const id = currentAndDiff.ref.value.id
        return <div key={'line-' + id} className="document-line">
            {this.renderDocumentNameAndIcon(id, currentAndDiff)}
            {this.renderDocumentVersions(id, currentAndDiff)}
            {this.renderDocumentJson(id, currentAndDiff)}
        </div>
    }

    renderDocumentJson(id, currentAndDiff) {
        return <pre className="currentjson">
            {JSON.stringify(currentAndDiff.current, null, 2)}
        </pre>
    }

    renderDocumentNameAndIcon(id, currentAndDiff) {
        return <div className="document-icon-name" key={'icon-name' + id}>
            <div className="document-name" key={'name' + id}> {currentAndDiff.current.name} </div>
            <img className="document-icon" src={documentIcon} alt="document" key={'img' + id} />
        </div >
    }

    renderDocumentVersions(id, currentAndDiff) {
        return <div className="document-versions" key={'versions' + id}>
            {currentAndDiff.diffs.map((diffAndDoc, versionIndex) => this.renderDocumentVersion(id, versionIndex, diffAndDoc))}
        </div >
    }

    renderDocumentVersion(id, versionIndex, diffAndDoc) {
        const idAndTs = id + '_' + versionIndex
        return <div className="document-version" key={'version' + idAndTs}>
            <div className="lines" onClick={() => this.selectDiffDot(diffAndDoc)}>
                {/* either price or amount will be changed  */}
                <div className="line"></div>
                {diffAndDoc.selected ? this.showSelectedDocumentVersion(diffAndDoc) : null}
                <div className="dot" ></div>
            </div>
        </div>
    }

    showSelectedDocumentVersion(diffAndDoc) {
        return <pre className="diffdata">
            {JSON.stringify(diffAndDoc.diff.data, null, 2)}
        </pre>
    }
}
