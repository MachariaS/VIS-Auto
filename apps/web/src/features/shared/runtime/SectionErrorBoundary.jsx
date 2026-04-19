import React from 'react';

export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section-shell">
          <div className="section-state-card error">
            <strong>{this.props.title || 'Section failed to render.'}</strong>
            <p>{this.props.description || 'An unexpected UI error occurred in this section.'}</p>
            {this.props.onRetry ? (
              <button className="secondary-cta" type="button" onClick={this.props.onRetry}>
                Retry section
              </button>
            ) : null}
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
