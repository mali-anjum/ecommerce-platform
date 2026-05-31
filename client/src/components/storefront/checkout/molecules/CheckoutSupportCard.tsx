import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const CheckoutSupportCard = () => {
  const router = useRouter();

  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
            <Phone className="h-3 w-3 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Need Help?</h4>
            <p className="text-sm text-muted-foreground">
              Contact our support team 24/7
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-3 border-border"
          onClick={() => router.push("/contact")}
        >
          <Phone className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </CardContent>
    </Card>
  );
};