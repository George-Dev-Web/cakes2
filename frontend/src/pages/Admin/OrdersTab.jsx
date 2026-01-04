import { formatPrice } from "../../utils/formatting";

const OrdersTab = ({ orders, onStatusUpdate }) => {
  return (
    <div className="orders-table">
      <h3>All Orders</h3>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Cake</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <div>{order.customer_name}</div>
                  <small>{order.customer_email}</small>
                </td>
                <td>{order.cake_name}</td>
                <td>{order.quantity}</td>
                <td>{formatPrice(order.total_price)}</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="order-actions">
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => onStatusUpdate(order.id, "confirmed")}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => onStatusUpdate(order.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <button
                        onClick={() => onStatusUpdate(order.id, "completed")}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersTab;
