class PageLoadingWorker {
  #actionIntervalId;
  #checkIntervalId;
  #hasMutations;
  #observer;

  constructor(
    targetElement,
    pageLoadingChecker,
    action,
    onFinishedCallback,
    actionIntervalLength,
    loadingTimeoutLength
  ) {
    this.targetElement = targetElement;
    this.pageLoadingChecker = pageLoadingChecker;
    this.action = action;
    this.onFinishedCallback = onFinishedCallback;
    this.actionIntervalLength = actionIntervalLength;
    this.loadingTimeoutLength = loadingTimeoutLength;
  }

  #runAction() {
    console.log('PageLoadingWorker: runAction()');
    if (this.action) {
      this.action();
    }
  }

  start() {
    this.#hasMutations = false;

    this.#observer = new MutationObserver((mutations) => {
      this.#hasMutations = true;
    });
    this.#observer.observe(this.targetElement, {
      childList: true,
      subtree: true,
    });

    this.#actionIntervalId = setInterval(this.action, this.actionIntervalLength);

    this.#checkIntervalId = setInterval(() => {
      if (this.pageLoadingChecker()) {
        return;
      }
      if (this.#hasMutations) {
        this.#runAction();
        this.#hasMutations = false;
      } else {
        this.finish();
      }
    }, this.loadingTimeoutLength);
    this.#runAction();
  }

  finish() {
    clearInterval(this.#checkIntervalId);
    clearInterval(this.#actionIntervalId);
    this.#observer.disconnect();
    this.#observer = null;
    if (this.onFinishedCallback) {
      this.onFinishedCallback();
    }
  }
}

module.exports = { PageLoadingWorker };
