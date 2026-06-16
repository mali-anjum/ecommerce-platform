import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Globe, Home, MapPin, Phone, Plus, Shield } from "lucide-react";

interface AddressSelectionProps {
  addresses: any[];
  selectedAddress: string;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: () => void;
}

export function AddressSelection({ 
  addresses, 
  selectedAddress, 
  onSelectAddress, 
  onAddNewAddress 
}: AddressSelectionProps) {
  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Delivery Address</h3>
            <p className="text-sm text-muted-foreground">Select where to deliver your order</p>
          </div>
        </div>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-2">No addresses saved</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add a delivery address to continue
              </p>
              <Button onClick={onAddNewAddress}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </div>
          ) : (
            <>
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedAddress === address.id 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => onSelectAddress(address.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center mt-1 ${
                      selectedAddress === address.id 
                        ? 'bg-primary' 
                        : 'border-2 border-border'
                    }`}>
                      {selectedAddress === address.id && (
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{address.name}</span>
                          {address.isDefault && (
                            <Badge className="bg-primary/20 text-primary border-primary/20">
                              <Shield className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {selectedAddress === address.id && (
                          <Badge className="bg-success/20 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{address.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {address.city}, {address.country} {address.postalCode}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{address.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={onAddNewAddress} 
                variant="outline" 
                className="w-full border-border hover:border-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Use Different Address
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}