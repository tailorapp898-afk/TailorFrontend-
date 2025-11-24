import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ChevronDown,
  ClipboardEdit,
  Clock,
  Plus,
  Trash2,
  Ruler,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

export default function CustomerCard({
  customer,
  onAddOrder,
  onEditLastOrder,
  onViewHistory,
  onDelete,
  onAddMeasurement,
  onViewMeasurement,
  onOrderDelivered,
  onEditCustomer,
  onSendMessage,
  onEditMeasurement,
}) {
  const lastOrder = customer.latestOrder || null;
  const latestStatus = lastOrder?.status || "No Orders";
  const hasMeasurement = customer.measurements && customer.measurements.length > 0;

  const getStatusVariant = (status) => {
    switch (status) {
      case "delivered":
        return "success";
      case "ready":
        return "info";
      case "in-progress":
        return "warning";
      case "confirmed":
        return "secondary";
      case "pending":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription className="mt-1">
              <p>📱 {customer.phone || "N/A"}</p>
              <p>👪 {customer.familyId?.name || "No Family"}</p>
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Orders: {customer.totalOrders}
            </p>
            {lastOrder && (
              <p className="text-xs text-gray-400 mt-1">
                #{lastOrder._id.slice(-4)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant(latestStatus)}>{latestStatus}</Badge>
          {lastOrder?.deliveryDate && (
            <p className="text-xs text-gray-500">
              📦 Delivery:{" "}
              {new Date(lastOrder.deliveryDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onAddOrder} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={onEditLastOrder}
            disabled={!lastOrder}
            size="sm"
            variant="secondary"
          >
            <ClipboardEdit className="mr-2 h-4 w-4" />
            Edit Last
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onViewHistory}>
                <Clock className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              {hasMeasurement ? (
                <DropdownMenuItem onClick={onEditMeasurement}>
                  <Ruler className="mr-2 h-4 w-4" />
                  Edit Measurement
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onAddMeasurement}>
                  <Ruler className="mr-2 h-4 w-4" />
                  Add Measurement
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onViewMeasurement}>
                <Ruler className="mr-2 h-4 w-4" />
                View Measurements
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOrderDelivered}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Delivered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditCustomer}>
                <ClipboardEdit className="mr-2 h-4 w-4" />
                Edit Customer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendMessage}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
