import React from 'react';
import { connect } from 'react-redux';
import './styles.scss';

class OrderBook extends React.Component {
  constructor(props) {
    super(props);
    this.lastUpdatedAt = null;
    this.forceRenderTimer = null;
  }

  // max 1 render in 1 second
  shouldComponentUpdate() {
    if (this.lastUpdatedAt) {
      const diff = new Date().valueOf() - this.lastUpdatedAt;
      const shouldRender = diff > 1000;

      if (!shouldRender && !this.forceRenderTimer) {
        this.forceRenderTimer = setTimeout(() => {
          this.forceUpdate();
          this.forceRenderTimer = null;
        }, 1000 - diff);
      }
      return shouldRender;
    } else {
      return true;
    }
  }

  componentWillUnmount() {
    if (this.forceRenderTimer) {
      clearInterval(this.forceRenderTimer);
    }
  }

  componentDidUpdate() {
    this.lastUpdatedAt = new Date();
  }

  maxPriceFromAsk(asks) {
    let max = 0;
    asks.forEach(element => {
      const price = element[0].toFixed(this.props.currentMarket.priceDecimals);
      if (max < price) {
        max = price;
      }
    });
    return max;
  }

  calculateBarWidth(maxPrice, price) {
    const width = ~~((price / maxPrice) * 32); //32 is the max percentage
    return width + '%';
  }

  render() {
    const { bids, asks, websocketConnected, currentMarket, dollarExchangeRate, exchangeRateLoading } = this.props;
    const asksArray = asks.slice(-20).reverse().toArray();
    const bidsArray = bids.slice(-20).reverse().toArray();
    const asksMaxPrice = this.maxPriceFromAsk(asksArray);
    const bidsMaxPrice = this.maxPriceFromAsk(bidsArray);

    return (
      <div className="orderbook flex-column flex-1">
        <div className="flex header text-secondary">
          <div className="col-6 text-center border-right">Amount</div>
          <div className="col-6 text-center">Price</div>
        </div>
        <div className="flex-column flex-1">
          <div className="asks flex-column flex-column-reverse flex-1 overflow-hidden">
            {asksArray
              .map(([price, amount]) => {
                const dollarValue = price * dollarExchangeRate;
                return (
                  <div className="ask flex align-items-center border" key={price.toString()}>
                    <div className="col-6 orderbook-amount border-right text-center">
                      {amount.toFixed(currentMarket.amountDecimals)}
                    </div>
                    <div className="col-6 text-danger text-left">
                      <span className="price text-left position-relative">{price.toFixed(currentMarket.priceDecimals)} ({dollarValue.toFixed(2)} $)</span>
                      <span className="price-bar" style={{width: this.calculateBarWidth(asksMaxPrice, price.toFixed(currentMarket.priceDecimals))}}></span>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="status border-top border-bottom">
            {websocketConnected ? (
              <div className="col-6 text-success">
                <i className="fa fa-circle" aria-hidden="true" /> RealTime
              </div>
            ) : (
              <div className="col-6 text-danger">
                <i className="fa fa-circle" aria-hidden="true" /> Disconnected
              </div>
            )}
          </div>
          <div className="bids flex-column flex-1 overflow-hidden">
            {bidsArray
              .map(([price, amount]) => {
                const dollarValue = price * dollarExchangeRate;
                return (
                  <div className="ask flex align-items-center border" key={price.toString()}>
                    <div className="col-6 orderbook-amount border-right text-center">
                      {amount.toFixed(currentMarket.amountDecimals)}
                    </div>
                    <div className="col-6 text-danger text-left">
                      <span className="price text-left position-relative">{price.toFixed(currentMarket.priceDecimals)} ({dollarValue.toFixed(2)} $)</span>
                      <span className="price-bar" style={{width: this.calculateBarWidth(bidsMaxPrice, price.toFixed(currentMarket.priceDecimals))}}></span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const currentMarket = state.market.getIn(['markets', 'currentMarket']);
  return {
    asks: state.market.getIn(['orderbook', 'asks']),
    bids: state.market.getIn(['orderbook', 'bids']),
    loading: false,
    currentMarket,
    websocketConnected: state.config.get('websocketConnected'),
    theme: state.config.get('theme'),
    exchangeRateLoading: state.market.getIn(['exchangeRate', 'loading']),
    dollarExchangeRate: state.market.getIn(['exchangeRate', 'data', currentMarket['quoteToken']]),
  };
};

export default connect(mapStateToProps)(OrderBook);
