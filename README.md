# sveltekit-discriminated-fields

Type-safe discriminated union support for SvelteKit remote function form fields.

## The Problem

When using SvelteKit's remote function `form()` with discriminated union schemas (e.g., Zod's `z.discriminatedUnion`), the generated `fields` object is a **union of field objects**. TypeScript only allows access to properties that exist on ALL variants - meaning variant-specific fields are completely inaccessible.

Given a typical SvelteKit setup:

```typescript
// data.remote.ts
import { z } from "zod";
import { form } from "$app/server/remote";

const shapeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("circle"), radius: z.number() }),
  z.object({
    kind: z.literal("rectangle"),
    width: z.number(),
    height: z.number(),
  }),
  z.object({ kind: z.literal("point") }),
]);

export const shapeForm = form(shapeSchema, async (data) => {
  // handle form submission
});
```

```svelte
<!-- +page.svelte (without this library) -->
<script lang="ts">
  import { shapeForm } from './data.remote.ts';

  const form = shapeForm();
  const shape = form.fields;
</script>

<select {...shape.kind.as('select')}>
  <option value="circle">Circle</option>
  <option value="rectangle">Rectangle</option>
  <option value="point">Point</option>
</select>

{#if shape.kind.value() === 'circle'}
  <!-- ERROR: Property 'radius' does not exist on type 'ShapeFields' -->
  <input {...shape.radius.as('number')} />
{:else if shape.kind.value() === 'rectangle'}
  <!-- ERROR: Property 'width' does not exist on type 'ShapeFields' -->
  <input {...shape.width.as('number')} />
{/if}
```

The issue: `shape.kind.value() === 'circle'` doesn't narrow the type because method calls don't provide TypeScript control flow analysis. You're stuck - variant-specific fields are inaccessible, and there's no way to narrow to access them.

## The Solution

This library wraps your discriminated union fields to:

1. Make all variant fields accessible
2. Add a `${key}Value` property that enables TypeScript narrowing

```svelte
<!-- +page.svelte (with this library) -->
<script lang="ts">
  import { shapeForm } from './data.remote.ts';
  import { discriminatedFields } from 'sveltekit-discriminated-fields';  // +

  const form = shapeForm();
  const shape = discriminatedFields('kind', form.fields);                 // changed
</script>

<select {...shape.kind.as('select')}>
  <option value="circle">Circle</option>
  <option value="rectangle">Rectangle</option>
  <option value="point">Point</option>
</select>

{#if shape.kindValue === 'circle'}<!-- changed -->
  <input {...shape.radius.as('number')} /><!-- now works! -->
{:else if shape.kindValue === 'rectangle'}<!-- changed -->
  <input {...shape.width.as('number')} /><!-- now works! -->
  <input {...shape.height.as('number')} />
  <!-- ERROR: Property 'radius' does not exist - correctly rejected -->
  <input {...shape.radius.as('number')} />
{/if}
```

The changes:

1. Import `discriminatedFields` from this library
2. Wrap `form.fields` with `discriminatedFields('kind', ...)`
3. Use `shape.kindValue` instead of `shape.kind.value()` for narrowing

## Installation

```bash
npm install sveltekit-discriminated-fields
```

## Usage

```svelte
<script lang="ts">
  import { paymentForm } from './data.remote.ts';
  import { discriminatedFields } from 'sveltekit-discriminated-fields';

  const form = paymentForm();

  // Wrap fields with $derived for reactivity
  // The first argument is your discriminator key (e.g., 'type', 'kind', 'channel')
  const payment = $derived(discriminatedFields('type', form.fields));

  function setCardDefaults() {
    // set() is type-safe - TypeScript enforces correct fields for each variant
    payment.set({ type: 'card', cardNumber: '', cvv: '' });
  }
</script>

<!-- typeValue is undefined until form is initialized -->
{#if payment.typeValue === undefined}
  <p>Loading...</p>
{:else}
  <select {...payment.type.as('select')}>
    <option value="card">Card</option>
    <option value="bank">Bank Transfer</option>
  </select>

  <!-- Use typeValue (not type.value()) for type narrowing -->
  {#if payment.typeValue === 'card'}
    <input {...payment.cardNumber.as('string')} />
    <input {...payment.cvv.as('string')} />
  {:else if payment.typeValue === 'bank'}
    <input {...payment.accountNumber.as('string')} />
    <input {...payment.sortCode.as('string')} />
  {/if}
{/if}
```

## API

### `discriminatedFields(key, fields)`

Wraps discriminated union form fields for type-safe narrowing.

**Parameters:**

- `key` - The discriminator key (e.g., `'type'`, `'kind'`, `'channel'`)
- `fields` - Form fields from a discriminated union schema

**Returns:** A proxy object with:

- All original fields passed through unchanged
- `${key}Value` - The current discriminator value (for narrowing)
- `set()` - Type-safe setter that infers variant from discriminator

### `DiscriminatedData<T>`

Type helper that extracts the underlying data type from wrapped fields:

```typescript
const payment = discriminatedFields('type', form.fields);
type Payment = DiscriminatedData<typeof payment>;
// { type: 'card'; cardNumber: string; cvv: string } | { type: 'bank'; accountNumber: string; sortCode: string }
```

Useful when you need to reference the data type elsewhere, such as defining default values or passing data to other functions.

## Note on Runtime Behavior

Type narrowing is compile-time only. At runtime, `'width' in shape` will return `true` even when `kindValue === 'circle'`, because all variant fields exist on the underlying object.

## License

MIT
