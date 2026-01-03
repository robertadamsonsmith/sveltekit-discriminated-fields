# sveltekit-discriminated-fields

Type-safe discriminated union support for SvelteKit remote function form fields.

This library provides two complementary tools for working with discriminated unions in SvelteKit forms:

- **`discriminatedFields()`** - A wrapper function that enables proper TypeScript type narrowing on form field objects
- **`UnionVariants`** - A component that renders variant-specific form sections with CSS-only visibility, supporting progressive enhancement (works without JavaScript)

The implementation prioritises:

- **Static type safety** - Catch errors at compile time with clear error messages
- **Progressive enhancement** - Forms work identically with or without JavaScript
- **Minimal boilerplate** - Simple API that stays out of your way
- **Flexibility** - Use as much or as little as you need

This library exposes existing SvelteKit form behaviour with improved typing for discriminated unions. Runtime overhead is minimal - just a thin proxy wrapper.

## Installation

```bash
npm install sveltekit-discriminated-fields
```

## UnionVariants Component

The `UnionVariants` component provides declarative variant rendering with **full progressive enhancement support**. It uses CSS-only visibility toggling via `:has()` selectors, so forms work identically with or without JavaScript enabled.

Given a SvelteKit remote function using Zod (this library also works with [Valibot](./test/src/routes/valibot-form) or other validation libraries):

```typescript
// data.remote.ts
import { z } from "zod";
import { form } from "$app/server";

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
  // handle submission
});
```

Use `UnionVariants` to render variant-specific fields:

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { UnionVariants } from 'sveltekit-discriminated-fields';
</script>

<form {...shapeForm}>
  <select {...shapeForm.fields.kind.as('select')}>
    <option value="">Select a shape...</option>
    <option value="circle">Circle</option>
    <option value="rectangle">Rectangle</option>
    <option value="point">Point</option>
  </select>

  <UnionVariants fields={shapeForm.fields} key="kind">
    {#snippet fallback()}
      <p>Please select a shape type above.</p>
    {/snippet}

    {#snippet circle(s)}
      <input {...s.radius.as('number')} placeholder="Radius" />
    {/snippet}

    {#snippet rectangle(s)}
      <input {...s.width.as('number')} placeholder="Width" />
      <input {...s.height.as('number')} placeholder="Height" />
    {/snippet}

    {#snippet point(_s)}
      <p>Point has no additional fields.</p>
    {/snippet}
  </UnionVariants>

  <button type="submit">Submit</button>
</form>
```

The optional `fallback` snippet is displayed when no variant is currently selected (i.e., when the discriminator field is empty).

Each snippet receives correctly narrowed fields for that variant - TypeScript knows `s.radius` exists in the `circle` snippet but not in `rectangle`. Only valid discriminator values are accepted.

Snippets only receive fields **specific to that variant**. Fields common to all variants (same name and type) should be rendered outside `UnionVariants` to prevent accidental duplicate inputs. Fields shared by some but not all variants, or with differing types across variants, produce compile-time errors.

### Radio Buttons

For radio button discriminators, you must use the `discriminatedFields()` wrapper. The raw SvelteKit field object's `.as("radio", value)` method doesn't work with discriminated unions (causes a static error). The wrapped version is type-safe - only valid discriminator values are accepted:

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { discriminatedFields, UnionVariants } from 'sveltekit-discriminated-fields';

  const shape = $derived(discriminatedFields('kind', shapeForm.fields));
</script>

<form {...shapeForm}>
  <fieldset>
    <label><input {...shape.kind.as("radio", "circle")} /> Circle</label>
    <label><input {...shape.kind.as("radio", "rectangle")} /> Rectangle</label>
    <label><input {...shape.kind.as("radio", "point")} /> Point</label>
  </fieldset>

  <UnionVariants fields={shape} key="kind">
    <!-- snippets work the same way -->
  </UnionVariants>
</form>
```

See the [radio-form example](./test/src/routes/radio-form) for a complete working example.

### Non-Sibling Layouts with `selector`

By default, `UnionVariants` expects the discriminator input (select or radios) to be a sibling element. For complex layouts where this isn't possible, use the `selector` prop:

```svelte
<div class="header">
  <select {...shape.kind.as('select')} id="shape-select">
    <!-- options -->
  </select>
</div>

<div class="body">
  <!-- Not a sibling of the select! -->
  <UnionVariants fields={shape} key="kind" selector="#shape-select">
    <!-- snippets -->
  </UnionVariants>
</div>
```

See the [selector-form example](./test/src/routes/selector-form) for select elements or [selector-radio-form example](./test/src/routes/selector-radio-form) for radio buttons.

### Nested and Multiple Unions

The discriminated union doesn't need to be the top-level schema. It can be nested within a larger object:

```typescript
const orderSchema = z.object({
  orderId: z.string(),
  shipping: z.discriminatedUnion("method", [
    z.object({ method: z.literal("pickup"), store: z.string() }),
    z.object({ method: z.literal("delivery"), address: z.string() }),
  ]),
});
```

```svelte
<UnionVariants fields={orderForm.fields.shipping} key="method">
  <!-- snippets for pickup and delivery -->
</UnionVariants>
```

You can also have multiple discriminated unions in the same form, or even a discriminated union nested within another discriminated union. See the [nested-form example](./test/src/routes/nested-form) for nested unions within objects, or [nested-union-form example](./test/src/routes/nested-union-form) for a union inside a union.

### Partial Variants

By default, `UnionVariants` requires a snippet for every variant - a compile error appears if one is missing, helping you avoid omissions. When you intentionally want to handle only some variants, use `partial={true}`:

```svelte
<UnionVariants fields={shape} key="kind" partial={true}>
  {#snippet circle(s)}
    <input {...s.radius.as('number')} />
  {/snippet}

  {#snippet rectangle(s)}
    <input {...s.width.as('number')} />
  {/snippet}

  <!-- point snippet omitted - fallback shown when point selected -->
</UnionVariants>
```

## discriminatedFields Function

When using SvelteKit's remote function `form()` with discriminated union schemas, the generated `fields` object is a union of field objects. TypeScript only allows access to properties that exist on ALL variants - meaning variant-specific fields are inaccessible, and `.as("radio", value)` doesn't work.

The `discriminatedFields()` function wraps your form fields to:

1. Make all variant fields accessible
2. Add a `${key}Value` property that enables TypeScript narrowing
3. Provide a type-safe `set()` method for programmatic updates
4. Fix `.as("radio", value)` to accept only valid discriminator values

The following example demonstrates conditionally rendering variant-specific fields with type-safe narrowing, without using `UnionVariants`. This approach requires JavaScript (unlike `UnionVariants` which works without JS):

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { discriminatedFields } from 'sveltekit-discriminated-fields';

  const shape = $derived(discriminatedFields('kind', shapeForm.fields));
</script>

<!-- Use kindValue (not kind.value()) for type narrowing -->
{#if shape.kindValue === 'circle'}
  <input {...shape.radius.as('number')} /> <!-- TypeScript knows radius exists -->
{:else if shape.kindValue === 'rectangle'}
  <input {...shape.width.as('number')} />  <!-- TypeScript knows width exists -->
  <input {...shape.height.as('number')} />
{/if}
```

See the [programmatic-form example](./test/src/routes/programmatic-form) for usage of `set()` and other programmatic features.

## API

### `UnionVariants`

A component for rendering variant-specific form sections with CSS-only visibility.

**Props:**

| Prop       | Type                  | Description                                                 |
| ---------- | --------------------- | ----------------------------------------------------------- |
| `fields`   | `DiscriminatedFields` | The wrapped form fields from `discriminatedFields()`        |
| `key`      | `string`              | The discriminator key (must match a field in the schema)    |
| `selector` | `string` (optional)   | CSS selector for the discriminator input when not a sibling |
| `partial`  | `boolean` (optional)  | Allow missing snippets for some variants                    |

**Snippets:**

- `fallback` - Rendered when no variant is selected
- `{variantName}(fields)` - One snippet per variant, receives narrowed fields

### `discriminatedFields(key, fields)`

Wraps discriminated union form fields for type-safe narrowing.

**Parameters:**

- `key` - The discriminator key (must exist as a field in all variants)
- `fields` - Form fields from a discriminated union schema

**Returns:** A proxy object with:

- All original fields passed through unchanged
- `${key}Value` - The current discriminator value (for narrowing)
- `set(data)` - Type-safe setter that infers variant from discriminator

### `DiscriminatedData<T>`

Type helper that extracts the underlying data type from wrapped fields:

```typescript
const payment = discriminatedFields("type", form.fields);
type Payment = DiscriminatedData<typeof payment>;
// { type: 'card'; cardNumber: string; cvv: string } | { type: 'bank'; ... }
```

## License

MIT
