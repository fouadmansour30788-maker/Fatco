import PageHeader from "@/app/components/PageHeader";
import ItemForm from "../ItemForm";
import { createItem } from "../actions";

export default function NewItemPage() {
  return (
    <>
      <PageHeader title="New item" subtitle="Add a product or service to the catalog" />
      <div className="p-8">
        <ItemForm action={createItem} />
      </div>
    </>
  );
}
