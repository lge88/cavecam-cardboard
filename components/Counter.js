import React, { Component, PropTypes } from 'react';

class Counter extends Component {
  render() {
    const { increment, decrement, count } = this.props;
    return (
      <p>
        Clicked: {count} times
        {' '}
        <button onClick={increment}>+</button>
        {' '}
        <button onClick={decrement}>-</button>
      </p>
    );
  }
};

Counter.propTypes = {
  increment: PropTypes.func.isRequired,
  decrement: PropTypes.func.isRequired,
  count: PropTypes.number.isRequired
};

export default Counter;
