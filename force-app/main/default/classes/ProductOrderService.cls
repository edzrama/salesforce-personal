public with sharing class ProductOrderService {
	@InvocableMethod(label='Create Order with Product'description='Creates an Order for the Contacts Account and adds the selected Product')
	public static List<OrderResponse> createOrder(List<OrderRequest> requests) {
		List<OrderResponse> responses = new List<OrderResponse>();
		// Get Standard Pricebook ID
		Id pricebookId;
		try {
			pricebookId = [SELECT Id FROM Pricebook2 WHERE IsActive = TRUE LIMIT 1].Id;
		} catch (Exception e) {
			System.debug('Error: Standard Pricebook not found!');
			return new List<OrderResponse>{new OrderResponse('Error: Standard Pricebook not found!')};
		}

		for (OrderRequest request : requests) {
			OrderResponse response = new OrderResponse();

			// Get Contact and related Account
			try {
				Contact con = [SELECT AccountId FROM Contact WHERE Id = :request.contactId LIMIT 1];

				if (con.AccountId == null) {
					response.message = 'No related Account found for the Contact.';
					responses.add(response);
					continue;
				} else {
					response.accountId = con.AccountId;
				}

				// Get Product either by ID or Name
				Product2 product;
				try {
					if (request.productId != null) {
						product = [SELECT Id FROM Product2 WHERE Id = :request.productId AND IsActive = TRUE LIMIT 1];
					} else if (request.productName != null) {
						product = [SELECT Id FROM Product2 WHERE Name = :request.productName AND IsActive = TRUE LIMIT 1];
					} else {
						response.message = 'Product ID or Product Name must be provided.';
						responses.add(response);
						continue;
					}
				} catch (Exception e) {
					response.message = 'No active Product found.';
					responses.add(response);
					continue;
				}

				// Get Product Pricebook Entry
				PricebookEntry pbe;
				try {
					pbe = [SELECT Id, UnitPrice FROM PricebookEntry WHERE Product2Id = :product.Id AND Pricebook2Id = :pricebookId AND IsActive = TRUE LIMIT 1];
				} catch (Exception e) {
					response.message = 'No active Pricebook Entry found for the selected Product.';
					responses.add(response);
					continue;
				}

				// Create Order
				Order newOrder = new Order(
					Name = 'New Order - ' + (request.productName != null ? request.productName : 'Unknown Product'),
					AccountId = con.AccountId,
					Status = 'Order Received',
					EffectiveDate = Date.today(),
					Pricebook2Id = pricebookId
				);
				insert newOrder;

				// Retrieve the Order again to get OrderNumber
				newOrder = [ SELECT Id, OrderNumber FROM Order WHERE Id = :newOrder.Id LIMIT 1];

				// Create Order Item
				OrderItem newOrderItem = new OrderItem(
					OrderId = newOrder.Id,
					PricebookEntryId = pbe.Id,
					Quantity = request.quantity,
					UnitPrice = pbe.UnitPrice
				);
				insert newOrderItem;

				response.orderId = newOrder.Id;
				response.orderNo = newOrder.OrderNumber;
				response.message = 'Order created successfully!';
			} catch (Exception e) {
				response.message = 'Error:' + e.getMessage();
			}
			responses.add(response);
		}
		return responses;
	}

	public class OrderRequest {
		@InvocableVariable(description='Contact ID')
		public Id contactId;

		@InvocableVariable(description='Product Name (Optional if Product ID is provided)')
		public string productName;

		@InvocableVariable(description='Product ID (Optional if Product Name is provided)')
		public Id productId;

		@InvocableVariable(description='Quantity')
		public Integer quantity;
	}
    
	public class OrderResponse {
		@InvocableVariable(description='Account ID')
		public Id accountId;

		@InvocableVariable(description='Order ID')
		public Id orderId;

		@InvocableVariable(description='Order Number')
		public String orderNo;

		@InvocableVariable(description='Status Message')
		public String message;

		// Default Constructor
		public OrderResponse() {
		}

		// Parameterized Constructor
		public OrderResponse(String msg) {
			this.message = msg;
		}
	}
}
