public with sharing class MultipleProductOrderService {
    @InvocableMethod(label='Create Order with multiple Products' description='Creates an Order for the Contact\'s Account and adds the selected Products')
    public static List<OrderResponse> createOrder(List<OrderRequest> requests) {
        List<OrderResponse> responses = new List<OrderResponse>();
        // makes sure to add profile access to this apex class for the agent
        // Get Standard Pricebook ID
        Id pricebookId;
        try {
            pricebookId = [SELECT Id FROM Pricebook2 WHERE IsActive = TRUE LIMIT 1].Id;
        } catch (Exception e) {
            System.debug('Error: Standard Pricebook not found!');
            return new List<OrderResponse>{ new OrderResponse('Error: Standard Pricebook not found!') };
        }

        for (OrderRequest request : requests) {
            OrderResponse response = new OrderResponse();

            try {
                Contact con = [SELECT AccountId FROM Contact WHERE Id = :request.contactId LIMIT 1];

                if (con.AccountId == null) {
                    response.message = 'No related Account found for the Contact.';
                    responses.add(response);
                    continue;
                } else {
                    response.accountId = con.AccountId;
                }

                // Create Order (single order for all products in request)
                Order newOrder = new Order(
                    Name = 'New Order for Contact ' + request.contactId,
                    AccountId = con.AccountId,
                    Status = 'Draft',
                    EffectiveDate = Date.today(),
                    Pricebook2Id = pricebookId
                );
                insert newOrder;
                newOrder = [SELECT Id, OrderNumber FROM Order WHERE Id = :newOrder.Id LIMIT 1];
                response.orderId = newOrder.Id;
                response.orderNo = newOrder.OrderNumber;

                // Loop through each product in the request
                for (ProductWrapper prod : request.products) {
                    Product2 product;
                    try {
                        if (prod.productId != null) {
                            product = [SELECT Id FROM Product2 WHERE Id = :prod.productId AND IsActive = TRUE LIMIT 1];
                        } else if (prod.productName != null) {
                            product = [SELECT Id FROM Product2 WHERE Name = :prod.productName AND IsActive = TRUE LIMIT 1];
                        } else {
                            response.message = 'Product ID or Name must be provided for one of the items.';
                            continue;
                        }
                    } catch (Exception e) {
                        response.message = 'Product not found or inactive.';
                        continue;
                    }

                    PricebookEntry pbe;
                    try {
                        pbe = [SELECT Id, UnitPrice FROM PricebookEntry WHERE Product2Id = :product.Id AND Pricebook2Id = :pricebookId AND IsActive = TRUE LIMIT 1];
                    } catch (Exception e) {
                        response.message = 'Pricebook Entry not found for product.';
                        continue;
                    }

                    OrderItem orderItem = new OrderItem(
                        OrderId = newOrder.Id,
                        PricebookEntryId = pbe.Id,
                        Quantity = prod.quantity,
                        UnitPrice = pbe.UnitPrice
                    );
                    insert orderItem;
                }

                response.message = 'Order created successfully with multiple products!';

            } catch (Exception e) {
                response.message = 'Error: ' + e.getMessage();
            }

            responses.add(response);
        }

        return responses;
    }

    public class ProductWrapper {
        @InvocableVariable(description='Product Name (Optional if Product ID is provided)')
        public String productName;

        @InvocableVariable(description='Product ID (Optional if Product Name is provided)')
        public Id productId;

        @InvocableVariable(description='Quantity')
        public Integer quantity;
    }

    public class OrderRequest {
        @InvocableVariable(description='Contact ID')
        public Id contactId;

        @InvocableVariable(description='List of Products and Quantities')
        public List<ProductWrapper> products;
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

        public OrderResponse() {}
        public OrderResponse(String msg) {
            this.message = msg;
        }
    }
}