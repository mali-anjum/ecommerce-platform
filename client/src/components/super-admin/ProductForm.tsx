// "use client";

// import { protectProductFormAction } from "@/actions/product";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { useProductStore } from "@/store/useProductStore";
// import { brands, categories, colors, sizes } from "@/utils/config";
// import { Upload } from "lucide-react";
// import Image from "next/image";
// import { useRouter, useSearchParams } from "next/navigation";
// import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

// // Move all your existing component logic here
// function ProductForm() {
//   const [formState, setFormState] = useState({
//     name: "",
//     brand: "",
//     description: "",
//     category: "",
//     gender: "",
//     price: "",
//     stock: "",
//   });

//   const [selectedSizes, setSelectSizes] = useState<string[]>([]);
//   const [selectedColors, setSelectColors] = useState<string[]>([]);
//   const [selectedfiles, setSelectFiles] = useState<File[]>([]);
//   const { toast } = useToast();
//   const searchParams = useSearchParams();
//   const getCurrentEditedProductId = searchParams.get("id");
//   const isEditMode = !!getCurrentEditedProductId;

//   const router = useRouter();
//   const { createProduct, updateProduct, getProductById, isLoading, error } =
//     useProductStore();

//   useEffect(() => {
//     if (isEditMode) {
//       getProductById(getCurrentEditedProductId).then((product) => {
//         if (product) {
//           setFormState({
//             name: product.name,
//             brand: product.brand,
//             description: product.description ?? "",
//             category: product.category,
//             gender: product.gender ?? "",
//             price: product.price.toString(),
//             stock: product.stock.toString(),
//           });
//           setSelectSizes(product.sizes);
//           setSelectColors(product.colors);
//         }
//       });
//     }
//   }, [isEditMode, getCurrentEditedProductId, getProductById, catalogDepartments]);

//   useEffect(() => {
//     console.log(getCurrentEditedProductId, "getCurrentEditedProductId");

//     if (getCurrentEditedProductId === null) {
//       setFormState({
//         name: "",
//         brand: "",
//         description: "",
//         category: "",
//         gender: "",
//         price: "",
//         stock: "",
//       });
//       setSelectColors([]);
//       setSelectSizes([]);
//     }
//   }, [getCurrentEditedProductId]);

//   // ... rest of your existing functions (handleInputChange, handleSelectChange, etc.)

//   const handleInputChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     setFormState((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSelectChange = (name: string, value: string) => {
//     setFormState((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleToggleSize = (size: string) => {
//     setSelectSizes((prev) =>
//       prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
//     );
//   };

//   const handleToggleColor = (color: string) => {
//     setSelectColors((prev) =>
//       prev.includes(color) ? prev.filter((s) => s !== color) : [...prev, color]
//     );
//   };

//   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files) {
//       setSelectFiles(Array.from(event.target.files));
//     }
//   };

//   const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     const checkFirstLevelFormSanitization = await protectProductFormAction();

//     if (!checkFirstLevelFormSanitization.success) {
//       toast({
//         title: checkFirstLevelFormSanitization.error,
//       });
//       return;
//     }

//     const formData = new FormData();
//     Object.entries(formState).forEach(([Key, value]) => {
//       formData.append(Key, value);
//     });

//     formData.append("sizes", selectedSizes.join(","));
//     formData.append("colors", selectedColors.join(","));

//     if (!isEditMode) {
//       selectedfiles.forEach((file) => {
//         formData.append("images", file);
//       });
//     }

//     const result = isEditMode
//       ? await updateProduct(getCurrentEditedProductId, formData)
//       : await createProduct(formData);
//     console.log(result, "result");
//     if (result) {
//       router.push("/super-admin/products/list");
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex flex-col gap-6">
//         <header className="flex items-center justify-between">
//           <h1>{isEditMode ? "Edit Product" : "Add Product"}</h1>
//         </header>
//         {/* Your existing form JSX */}

//         <form
//           onSubmit={handleFormSubmit}
//           className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"
//         >
//           {isEditMode ? null : (
//             <div className="mt-2 w-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-400 p-12">
//               <div className="text-center">
//                 <Upload className="mx-auto h-12 w-12 text-gray-400" />
//                 <div className="mt-4 flex text-sm leadin-6 text-gray-600">
//                   <Label>
//                     <span>Click to browse</span>
//                     <input
//                       type="file"
//                       className="sr-only"
//                       multiple
//                       onChange={handleFileChange}
//                     />
//                   </Label>
//                 </div>
//               </div>
//               {selectedfiles.length > 0 && (
//                 <div className="mt-4 flex flex-wrap gap-2">
//                   {selectedfiles.map((file, index) => (
//                     <div key={index} className="relative">
//                       <Image
//                         src={URL.createObjectURL(file)}
//                         alt={`Preview ${index + 1}`}
//                         width={80}
//                         height={80}
//                         className="h-20 w-20 object-cover rounded-md"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//           <div className="space-y-4">
//             <div>
//               <Label>Product Name</Label>
//               <Input
//                 name="name"
//                 placeholder="Product Name"
//                 className="mt-1.5"
//                 onChange={handleInputChange}
//                 value={formState.name}
//               />
//             </div>
//             <div>
//               <Label>Brand</Label>
//               <Select
//                 value={formState.brand}
//                 onValueChange={(value) => handleSelectChange("brand", value)}
//                 name="brand"
//               >
//                 <SelectTrigger className="mt-1.5">
//                   <SelectValue placeholder="Select Brand" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {brands.map((item) => (
//                     <SelectItem key={item} value={item.toLowerCase()}>
//                       {item}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Product Description</Label>
//               <Textarea
//                 name="description"
//                 className="mt-1.5 min-h-[150px]"
//                 placeholder="Product description"
//                 onChange={handleInputChange}
//                 value={formState.description}
//               />
//             </div>
//             <div>
//               <Label>Category</Label>
//               <Select
//                 value={formState.category}
//                 onValueChange={(value) => handleSelectChange("category", value)}
//                 name="category"
//               >
//                 <SelectTrigger className="mt-1.5">
//                   <SelectValue placeholder="Select Category" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {categories.map((item) => (
//                     <SelectItem key={item} value={item.toLowerCase()}>
//                       {item}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Gender</Label>
//               <Select
//                 value={formState.gender}
//                 onValueChange={(value) => handleSelectChange("gender", value)}
//                 name="gender"
//               >
//                 <SelectTrigger className="mt-1.5">
//                   <SelectValue placeholder="Select Gender" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="men">Men</SelectItem>
//                   <SelectItem value="women">Women</SelectItem>
//                   <SelectItem value="kids">Kids</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Size</Label>
//               <div className="mt-1.5 flex flex-wrap gap-2">
//                 {sizes.map((item) => (
//                   <Button
//                     onClick={() => handleToggleSize(item)}
//                     variant={
//                       selectedSizes.includes(item) ? "default" : "outline"
//                     }
//                     key={item}
//                     type="button"
//                     size={"sm"}
//                   >
//                     {item}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//             <div>
//               <Label>Colors</Label>
//               <div className="mt-1.5 flex flex-wrap gap-2">
//                 {colors.map((color) => (
//                   <Button
//                     key={color.name}
//                     type="button"
//                     className={`h-8 w-8 rounded-full ${color.class} ${
//                       selectedColors.includes(color.name)
//                         ? "ring-2 ring-primary ring-offset-2"
//                         : ""
//                     }`}
//                     onClick={() => handleToggleColor(color.name)}
//                   />
//                 ))}
//               </div>
//             </div>
//             <div>
//               <Label>Product Price</Label>
//               <Input
//                 name="price"
//                 className="mt-1.5"
//                 placeholder="Enter Product Price"
//                 value={formState.price}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <div>
//               <Label>Stock</Label>
//               <Input
//                 name="stock"
//                 className="mt-1.5"
//                 placeholder="Enter Product Stock"
//                 value={formState.stock}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <Button
//               disabled={isLoading}
//               type="submit"
//               className="mt-1.5 w-full"
//             >
//               {isLoading ? "Creating..." : "Create"}
//             </Button>
//           </div>
//         </form>

//       </div>
//     </div>
//   );
// }

// export default ProductForm;
"use client";

import { protectProductFormAction } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  inferSubcategoryFromTitle,
  type AdminCatalogDepartment,
} from "@/lib/catalog/inferSubcategoryFromTitle";
import { useProductStore } from "@/store/useProductStore";
import { API_ROUTES } from "@/utils/routes/api";
import { brands, colors, sizes } from "@/utils/config";
import axios from "axios";
import { 
  Upload, 
  Package, 
  Tag, 
  List, 
  Users, 
  Palette, 
  Ruler, 
  DollarSign,
  Box,
  Zap,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

// ==================== MODULAR COMPONENTS ====================

// 1. File Upload Component
function FileUploadSection({ 
  selectedFiles, 
  onFileChange, 
  isEditMode 
}: { 
  selectedFiles: File[]; 
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void; 
  isEditMode: boolean;
}) {
  if (isEditMode) return null;

  return (
    <div className="glass-effect rounded-2xl p-8 border border-glass-border">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse"></div>
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2">
          Upload Product Images
        </h3>
        <p className="text-muted-foreground mb-6">
          Drag & drop or click to browse futuristic product visuals
        </p>
        
        <Label className="cursor-pointer">
          <div className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 transition-colors hover:bg-primary/5">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-medium text-foreground">
                Click to browse or drag files
              </span>
              <span className="text-sm text-muted-foreground">
                Supports PNG, JPG, WEBP up to 10MB
              </span>
            </div>
          </div>
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/*"
            onChange={onFileChange}
          />
        </Label>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" />
            Selected Images ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="relative group overflow-hidden rounded-lg border border-border"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  width={120}
                  height={120}
                  className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                  <span className="text-white text-xs truncate">
                    {file.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Color Selection Component
function ColorSelection({ 
  selectedColors, 
  onToggleColor 
}: { 
  selectedColors: string[]; 
  onToggleColor: (color: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-accent" />
        Colors
      </Label>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onToggleColor(color.name)}
            className={`relative h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${
              color.class
            } ${
              selectedColors.includes(color.name)
                ? "ring-3 ring-primary ring-offset-2 ring-offset-card"
                : "ring-1 ring-border"
            }`}
            aria-label={`Select ${color.name} color`}
          >
            {selectedColors.includes(color.name) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white"></div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedColors.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedColors.join(", ")}
        </p>
      )}
    </div>
  );
}

// 3. Size Selection Component
function SizeSelection({ 
  selectedSizes, 
  onToggleSize 
}: { 
  selectedSizes: string[]; 
  onToggleSize: (size: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-secondary" />
        Sizes
      </Label>
      <div className="flex flex-wrap gap-2">
        {sizes.map((item) => (
          <Button
            key={item}
            onClick={() => onToggleSize(item)}
            variant="outline"
            size="sm"
            className={`rounded-full transition-all duration-300 ${
              selectedSizes.includes(item)
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary-light"
                : "border-border hover:border-primary"
            }`}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}

// 4. Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormField({ label, name, icon, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}


// ==================== MAIN COMPONENT ====================

function ProductForm() {
  const [formState, setFormState] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    gender: "",
    price: "",
    stock: "",
  });

  const [selectedSizes, setSelectSizes] = useState<string[]>([]);
  const [selectedColors, setSelectColors] = useState<string[]>([]);
  const [selectedFiles, setSelectFiles] = useState<File[]>([]);
  const [catalogDepartments, setCatalogDepartments] = useState<AdminCatalogDepartment[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [categoryAutoLocked, setCategoryAutoLocked] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const getCurrentEditedProductId = searchParams.get("id");
  const isEditMode = !!getCurrentEditedProductId;

  const router = useRouter();
  const { createProduct, updateProduct, getProductById, isLoading, error } =
    useProductStore();

  const selectedDepartment = useMemo(
    () => catalogDepartments.find((item) => item.id === selectedDepartmentId),
    [catalogDepartments, selectedDepartmentId]
  );

  const selectedSubcategory = useMemo(
    () =>
      selectedDepartment?.subcategories.find(
        (item) => item.id === selectedSubcategoryId
      ) ?? null,
    [selectedDepartment, selectedSubcategoryId]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchCatalog = async () => {
      try {
        const response = await axios.get(`${API_ROUTES.CATALOG}/structure`, {
          withCredentials: true,
        });
        const rows = response.data?.data ?? [];
        if (!cancelled && Array.isArray(rows)) {
          setCatalogDepartments(rows as AdminCatalogDepartment[]);
        }
      } catch (catalogError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch catalog structure", catalogError);
        }
      }
    };

    void fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubcategory) return;
    setFormState((prev) => ({
      ...prev,
      category: selectedSubcategory.title,
    }));
  }, [selectedSubcategory]);

  useEffect(() => {
    if (isEditMode) {
      getProductById(getCurrentEditedProductId).then((product) => {
        if (product) {
          setFormState({
            name: product.name,
            brand: product.brand,
            description: product.description ?? "",
            category: product.category,
            gender: product.gender ?? "",
            price: product.price.toString(),
            stock: product.stock.toString(),
          });
          setSelectSizes(product.sizes);
          setSelectColors(product.colors);

          if (product.subcategoryId) {
            setSelectedSubcategoryId(product.subcategoryId);
            for (const dept of catalogDepartments) {
              if (dept.subcategories.some((sub) => sub.id === product.subcategoryId)) {
                setSelectedDepartmentId(dept.id);
                break;
              }
            }
            setCategoryAutoLocked(true);
          } else {
            const guess = inferSubcategoryFromTitle(product.name, catalogDepartments);
            if (guess) {
              setSelectedDepartmentId(guess.departmentId);
              setSelectedSubcategoryId(guess.subcategoryId);
              setCategoryAutoLocked(true);
            }
          }
        }
      });
    }
  }, [isEditMode, getCurrentEditedProductId, getProductById, catalogDepartments]);

  useEffect(() => {
    if (getCurrentEditedProductId === null) {
      setFormState({
        name: "",
        brand: "",
        description: "",
        category: "",
        gender: "",
        price: "",
        stock: "",
      });
      setSelectColors([]);
      setSelectSizes([]);
      setSelectFiles([]);
      setSelectedDepartmentId("");
      setSelectedSubcategoryId("");
      setCategoryAutoLocked(true);
    }
  }, [getCurrentEditedProductId]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name" && categoryAutoLocked && !selectedSubcategoryId) {
      const guess = inferSubcategoryFromTitle(value, catalogDepartments);
      if (guess) {
        setSelectedDepartmentId(guess.departmentId);
        setSelectedSubcategoryId(guess.subcategoryId);
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedSubcategoryId("");
    setFormState((prev) => ({ ...prev, category: "" }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setCategoryAutoLocked(true);
  };

  const handleToggleSize = (size: string) => {
    setSelectSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleToggleColor = (color: string) => {
    setSelectColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectFiles(filesArray);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const checkFirstLevelFormSanitization = await protectProductFormAction();

    if (!checkFirstLevelFormSanitization.success) {
      toast({
        title: "Validation Error",
        description: checkFirstLevelFormSanitization.error,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append("sizes", selectedSizes.join(","));
    formData.append("colors", selectedColors.join(","));

    if (selectedSubcategoryId) {
      formData.append("subcategoryId", selectedSubcategoryId);
      if (selectedDepartment?.slug) {
        formData.append("departmentSlug", selectedDepartment.slug);
      }
      if (selectedSubcategory?.slug) {
        formData.append("subcategorySlug", selectedSubcategory.slug);
      }
    }

    if (!isEditMode) {
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    const result = isEditMode
      ? await updateProduct(getCurrentEditedProductId, formData)
      : await createProduct(formData);

    if (result) {
      toast({
        title: "Success!",
        description: isEditMode 
          ? "Product updated successfully" 
          : "Product created successfully",
        className: "bg-success/10 border-success/20 text-success",
      });
      router.push("/super-admin/products/list");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/30 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                {isEditMode ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEditMode 
                  ? "Update your futuristic product details" 
                  : "Add a new product to your futuristic collection"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/super-admin/products/list")}
                className="border-border hover:border-primary"
              >
                Back to List
              </Button>
              <div className="h-10 w-1 bg-border"></div>
              <span className="text-sm text-muted-foreground">
                {isEditMode ? "Edit Mode" : "Create Mode"}
              </span>
            </div>
          </div>
        </header>

        {/* Main Form */}
        <form onSubmit={handleFormSubmit} className="space-y-8">
          {/* File Upload Section */}
          <FileUploadSection 
            selectedFiles={selectedFiles} 
            onFileChange={handleFileChange} 
            isEditMode={isEditMode} 
          />

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Product Details */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Product Details
              </h2>

              <FormField label="Product Name" name="name" icon={<Package className="h-4 w-4" />}>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter futuristic product name"
                  className="bg-input border-border focus:ring-primary/50"
                  onChange={handleInputChange}
                  value={formState.name}
                  required
                />
              </FormField>

              <FormField label="Brand" name="brand" icon={<Tag className="h-4 w-4" />}>
                <Select
                  value={formState.brand}
                  onValueChange={(value) => handleSelectChange("brand", value)}
                  name="brand"
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select futuristic brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {brands.map((item) => (
                      <SelectItem key={item} value={item.toLowerCase()}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary/20"></div>
                          {item}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Description" name="description" icon={<List className="h-4 w-4" />}>
                <Textarea
                  id="description"
                  name="description"
                  className="min-h-[150px] bg-input border-border focus:ring-primary/50"
                  placeholder="Describe your futuristic product features..."
                  onChange={handleInputChange}
                  value={formState.description}
                  required
                />
              </FormField>

              <FormField label="Department" name="department" icon={<List className="h-4 w-4" />}>
                <Select value={selectedDepartmentId} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {catalogDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Subcategory" name="subcategory" icon={<Tag className="h-4 w-4" />}>
                <Select
                  value={selectedSubcategoryId}
                  onValueChange={handleSubcategoryChange}
                  disabled={!selectedDepartment || selectedDepartment.subcategories.length === 0}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(selectedDepartment?.subcategories ?? []).map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Category (resolved)" name="category" icon={<List className="h-4 w-4" />}>
                <Input
                  id="category"
                  name="category"
                  value={formState.category}
                  onChange={(e) => {
                    setCategoryAutoLocked(false);
                    handleInputChange(e);
                  }}
                  placeholder="Auto-filled from subcategory"
                  className="bg-input border-border focus:ring-primary/50"
                  required
                />
              </FormField>

              <FormField label="Gender" name="gender" icon={<Users className="h-4 w-4" />}>
                <Select
                  value={formState.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                  name="gender"
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select target gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="men">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        Men
                      </div>
                    </SelectItem>
                    <SelectItem value="women">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                        Women
                      </div>
                    </SelectItem>
                    <SelectItem value="kids">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        Kids
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Right Column - Variants & Pricing */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Box className="h-5 w-5 text-secondary" />
                Variants & Pricing
              </h2>

              {/* Size Selection */}
              <SizeSelection 
                selectedSizes={selectedSizes} 
                onToggleSize={handleToggleSize} 
              />

              {/* Color Selection */}
              <ColorSelection 
                selectedColors={selectedColors} 
                onToggleColor={handleToggleColor} 
              />

              <FormField label="Price" name="price" icon={<DollarSign className="h-4 w-4" />}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8 bg-input border-border focus:ring-primary/50"
                    onChange={handleInputChange}
                    value={formState.price}
                    required
                  />
                </div>
              </FormField>

              <FormField label="Stock Quantity" name="stock" icon={<Box className="h-4 w-4" />}>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="Enter available stock"
                  className="bg-input border-border focus:ring-primary/50"
                  onChange={handleInputChange}
                  value={formState.stock}
                  required
                />
              </FormField>

              {/* Submit Button */}
              <div className="pt-6 border-t border-border">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      {isEditMode ? "Update Product" : "Create Futuristic Product"}
                    </div>
                  )}
                </Button>
                
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Tips for Success
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use high-quality images (min. 1200x1200px)</li>
                    <li>• Provide detailed, futuristic descriptions</li>
                    <li>• Set competitive pricing for your market</li>
                    <li>• Select accurate categories for better visibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;