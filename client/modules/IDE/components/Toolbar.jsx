import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import * as IDEActions from '../actions/ide';
import * as preferenceActions from '../actions/preferences';
import * as projectActions from '../actions/project';
import * as completionActions from '../actions/completions';

import PlayIcon from '../../../images/play.svg';
import StopIcon from '../../../images/stop.svg';
import PreferencesIcon from '../../../images/preferences.svg';
import EditProjectNameIcon from '../../../images/pencil.svg';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
    this.handleProjectNameClick = this.handleProjectNameClick.bind(this);
    this.handleProjectNameSave = this.handleProjectNameSave.bind(this);
    this.handlePromptChange = this.handlePromptChange.bind(this);
    this.handlePromptSubmit = this.handlePromptSubmit.bind(this);

    this.state = {
      projectNameInputValue: props.project.name,
      promptValue: '',
      model: 'gpt-3.5-turbo-0613'
    };
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.hideEditProjectName();
      this.projectNameInput.blur();
    }
  }

  handleProjectNameChange(event) {
    this.setState({ projectNameInputValue: event.target.value });
  }

  handleSelectChange = (event) => {
    this.setState({ model: event.target.value });
  };

  handlePromptSubmit(event) {
    if (event.key === 'Enter') {
      this.props.getCompletion(
        this.state.promptValue,
        (content) => {
          console.log(content);
          this.props.setFileContent(content);
          this.props.startSketch();
          this.setState({ promptValue: '' });
        },
        this.state.model
      );
      // Todo: blur?
    }
  }

  handlePromptChange(event) {
    this.setState({ promptValue: event.target.value });
  }

  handleProjectNameClick() {
    if (this.canEditProjectName) {
      this.props.showEditProjectName();
      setTimeout(() => {
        this.projectNameInput?.focus();
      }, 140);
    }
  }

  handleProjectNameSave() {
    const newProjectName = this.state.projectNameInputValue.trim();
    if (newProjectName.length === 0) {
      this.setState({
        projectNameInputValue: this.props.project.name
      });
    } else {
      this.props.setProjectName(newProjectName);
      this.props.hideEditProjectName();
      if (this.props.project.id) {
        this.props.saveProject();
      }
    }
  }

  canEditProjectName() {
    return (
      (this.props.owner &&
        this.props.owner.username &&
        this.props.owner.username === this.props.currentUser) ||
      !this.props.owner ||
      !this.props.owner.username
    );
  }

  render() {
    const playButtonClass = classNames({
      'toolbar__play-button': true,
      'toolbar__play-button--selected': this.props.isPlaying
    });
    const stopButtonClass = classNames({
      'toolbar__stop-button': true,
      'toolbar__stop-button--selected': !this.props.isPlaying
    });
    const preferencesButtonClass = classNames({
      'toolbar__preferences-button': true,
      'toolbar__preferences-button--selected': this.props.preferencesIsVisible
    });
    const nameContainerClass = classNames({
      'toolbar__project-name-container': true,
      'toolbar__project-name-container--editing': this.props.project
        .isEditingName
    });

    const canEditProjectName = this.canEditProjectName();

    return (
      <>
        <div className="toolbar">
          <button
            className="toolbar__play-sketch-button"
            onClick={() => {
              this.props.syncFileContent();
              this.props.startAccessibleSketch();
              this.props.setTextOutput(true);
              this.props.setGridOutput(true);
            }}
            aria-label={this.props.t('Toolbar.PlaySketchARIA')}
            disabled={this.props.infiniteLoop}
          >
            <PlayIcon focusable="false" aria-hidden="true" />
          </button>
          <button
            className={playButtonClass}
            onClick={() => {
              this.props.syncFileContent();
              this.props.startSketch();
            }}
            aria-label={this.props.t('Toolbar.PlayOnlyVisualSketchARIA')}
            disabled={this.props.infiniteLoop}
          >
            <PlayIcon focusable="false" aria-hidden="true" />
          </button>
          <button
            className={stopButtonClass}
            onClick={this.props.stopSketch}
            aria-label={this.props.t('Toolbar.StopSketchARIA')}
          >
            <StopIcon focusable="false" aria-hidden="true" />
          </button>

          <button
            className="toolbar__undo-button"
            onClick={this.props.undo}
            aria-label={this.props.t('Toolbar.UndoARIA')}
          >
            &#9100; Undo
          </button>

          <button
            className="toolbar__redo-button"
            onClick={this.props.redo}
            aria-label={this.props.t('Toolbar.RedoARIA')}
          >
            &#10227; Redo
          </button>

          <select
            value={this.state.model}
            onChange={this.handleSelectChange}
            className="toolbar__model-select"
          >
            <option value="gpt-3.5-turbo-0613">GPT 3.5</option>
            <option value="gpt-3.5-turbo-16k">GPT 3.5 16K</option>
            <option value="gpt-4-0613">GPT 4</option>
          </select>

          <div className="toolbar__autorefresh">
            <input
              id="autorefresh"
              className="checkbox__autorefresh"
              type="checkbox"
              checked={this.props.autorefresh}
              onChange={(event) => {
                this.props.setAutorefresh(event.target.checked);
              }}
            />
            <label htmlFor="autorefresh" className="toolbar__autorefresh-label">
              {this.props.t('Toolbar.Auto-refresh')}
            </label>
          </div>
          <div className={nameContainerClass}>
            <button
              className="toolbar__project-name"
              onClick={this.handleProjectNameClick}
              disabled={!canEditProjectName}
              aria-label={this.props.t('Toolbar.EditSketchARIA')}
            >
              <span>{this.props.project.name}</span>
              {canEditProjectName && (
                <EditProjectNameIcon
                  className="toolbar__edit-name-button"
                  focusable="false"
                  aria-hidden="true"
                />
              )}
            </button>
            <input
              type="text"
              maxLength="128"
              className="toolbar__project-name-input"
              aria-label={this.props.t('Toolbar.NewSketchNameARIA')}
              value={this.state.projectNameInputValue}
              onChange={this.handleProjectNameChange}
              ref={(element) => {
                this.projectNameInput = element;
              }}
              onBlur={this.handleProjectNameSave}
              onKeyPress={this.handleKeyPress}
            />
            {(() => {
              if (this.props.owner) {
                return (
                  <p className="toolbar__project-owner">
                    {this.props.t('Toolbar.By')}{' '}
                    <Link to={`/${this.props.owner.username}/sketches`}>
                      {this.props.owner.username}
                    </Link>
                  </p>
                );
              }
              return null;
            })()}
          </div>
          <button
            className={preferencesButtonClass}
            onClick={this.props.openPreferences}
            aria-label={this.props.t('Toolbar.OpenPreferencesARIA')}
          >
            <PreferencesIcon focusable="false" aria-hidden="true" />
          </button>
        </div>
        <div style={{ width: '100%', display: 'block', position: 'relative' }}>
          {/* eslint-disable react/jsx-closing-tag-location */}
          <textarea
            style={{ width: '100%', display: 'block' }}
            placeholder="Say what you want to change and hit Enter"
            onChange={this.handlePromptChange}
            onKeyPress={this.handlePromptSubmit}
          ></textarea>
          {this.props.loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'left',
                alignItems: 'left',
                padding: 10,
                zIndex: 9999,
                color: 'white',
                fontSize: 18
              }}
            >
              Thinking...
            </div>
          )}
        </div>
      </>
    );
  }
}

Toolbar.propTypes = {
  loading: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  preferencesIsVisible: PropTypes.bool.isRequired,
  stopSketch: PropTypes.func.isRequired,
  setProjectName: PropTypes.func.isRequired,
  openPreferences: PropTypes.func.isRequired,
  owner: PropTypes.shape({
    username: PropTypes.string
  }),
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    isEditingName: PropTypes.bool,
    id: PropTypes.string
  }).isRequired,
  showEditProjectName: PropTypes.func.isRequired,
  hideEditProjectName: PropTypes.func.isRequired,
  infiniteLoop: PropTypes.bool.isRequired,
  autorefresh: PropTypes.bool.isRequired,
  setAutorefresh: PropTypes.func.isRequired,
  setTextOutput: PropTypes.func.isRequired,
  setGridOutput: PropTypes.func.isRequired,
  startSketch: PropTypes.func.isRequired,
  startAccessibleSketch: PropTypes.func.isRequired,
  saveProject: PropTypes.func.isRequired,
  currentUser: PropTypes.string,
  t: PropTypes.func.isRequired,
  syncFileContent: PropTypes.func.isRequired,
  setFileContent: PropTypes.func.isRequired,
  getCompletion: PropTypes.func.isRequired,
  undo: PropTypes.func.isRequired,
  redo: PropTypes.func.isRequired
};

Toolbar.defaultProps = {
  owner: undefined,
  currentUser: undefined
};

function mapStateToProps(state) {
  return {
    autorefresh: state.preferences.autorefresh,
    currentUser: state.user.username,
    infiniteLoop: state.ide.infiniteLoop,
    isPlaying: state.ide.isPlaying,
    owner: state.project.owner,
    preferencesIsVisible: state.ide.preferencesIsVisible,
    project: state.project,
    loading: state.loading
  };
}

const mapDispatchToProps = {
  ...IDEActions,
  ...preferenceActions,
  ...projectActions,
  ...completionActions
};

export const ToolbarComponent = withTranslation()(Toolbar);
export default connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);
