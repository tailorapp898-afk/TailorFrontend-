
import React from 'react';

export default function Invoice({ customer }) {
  const lastOrder = customer.latestOrder || {};

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Invoice</h2>
      <div className="flex justify-between mb-6">
        <div>
          <p className="font-bold">{customer.name}</p>
          <p>{customer.phone}</p>
        </div>
        <div>
          <p className="font-bold">Invoice #{lastOrder._id?.slice(-6)}</p>
          <p>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <table className="w-full mb-6">
        <thead>
          <tr>
            <th className="text-left font-bold">Description</th>
            <th className="text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lastOrder.items?.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td className="text-right">${item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end">
        <p className="font-bold text-xl">Total: ${lastOrder.totalAmount}</p>
      </div>
    </div>
  );
}
