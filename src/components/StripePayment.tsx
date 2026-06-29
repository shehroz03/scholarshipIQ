import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { api } from "../api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface StripePaymentProps {
  courseId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentForm = ({ courseId, amount, onSuccess, onCancel }: StripePaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Create payment intent
      const { clientSecret } = await api.request("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, amount }),
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
      } else if (paymentIntent.status === "succeeded") {
        // Enroll student
        await api.courses.enrollInCourse(courseId);
        toast.success("Payment successful! You are now enrolled.");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
            },
          }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : `Pay $${amount}`}
        </button>
      </div>
    </form>
  );
};

export const StripePayment = (props: StripePaymentProps) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;
