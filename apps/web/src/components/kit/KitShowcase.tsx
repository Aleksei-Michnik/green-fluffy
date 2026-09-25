'use client';

/* Developer surface: English-only by design (wiki/ui-kit.md "Showcase"). Not shipped to production. */

import {
  ArrowRight,
  Camera,
  Cat,
  Flower2,
  Leaf,
  MapPin,
  PawPrint,
  Plus,
  Search,
  Sprout,
  Trash2,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Chip } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { LinkButton } from '@/components/ui/LinkButton';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

const semanticTokens = [
  'canvas',
  'surface',
  'surface-raised',
  'surface-sunken',
  'line',
  'line-strong',
  'primary',
  'primary-soft',
  'accent',
  'accent-soft',
  'info-soft',
  'success-soft',
  'caution-soft',
  'danger-soft',
] as const;

const swatchClassNames: Record<(typeof semanticTokens)[number], string> = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  'surface-raised': 'bg-surface-raised',
  'surface-sunken': 'bg-surface-sunken',
  line: 'bg-line',
  'line-strong': 'bg-line-strong',
  primary: 'bg-primary',
  'primary-soft': 'bg-primary-soft',
  accent: 'bg-accent',
  'accent-soft': 'bg-accent-soft',
  'info-soft': 'bg-info-soft',
  'success-soft': 'bg-success-soft',
  'caution-soft': 'bg-caution-soft',
  'danger-soft': 'bg-danger-soft',
};

const variants: ButtonVariant[] = ['primary', 'secondary', 'tonal', 'outline', 'ghost', 'danger'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="flex flex-col gap-6">
      <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function KitShowcase() {
  const { addToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyDialogOpen, setBusyDialogOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [filter, setFilter] = useState<'all' | 'animals' | 'plants'>('all');
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Badge tone="primary" icon={<Sprout />}>
          Developer surface
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">UI kit</h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Every primitive in every state, in both themes and all four locales. Documented in
          wiki/ui-kit.md; scanned with axe by e2e/kit.spec.ts.
        </p>
      </header>

      <Section id="tokens" title="Tokens">
        <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-7">
          {semanticTokens.map((token) => (
            <li key={token} className="flex flex-col gap-1.5">
              <span
                className={`block h-14 rounded-control border border-line ${swatchClassNames[token]}`}
              />
              <code className="text-xs text-ink-muted">{token}</code>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <p className="text-4xl font-semibold tracking-tight">Display — text-4xl semibold</p>
          <p className="text-2xl font-semibold">Section — text-2xl semibold</p>
          <p className="text-xl font-semibold">Card title — text-xl semibold</p>
          <p className="text-base">Body — text-base, ink</p>
          <p className="text-base text-ink-muted">Secondary — text-base, ink-muted</p>
          <p className="text-sm text-ink-subtle">Caption — text-sm, ink-subtle</p>
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        {sizes.map((size) => (
          <Row key={size}>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
          </Row>
        ))}
        <Row>
          <Button leadingIcon={<Plus />}>Add a pet</Button>
          <Button variant="tonal" trailingIcon={<ArrowRight className="rtl:-scale-x-100" />}>
            Continue
          </Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button variant="danger" leadingIcon={<Trash2 />}>
            Delete
          </Button>
          <LinkButton href="/" variant="outline">
            Link button
          </LinkButton>
        </Row>
        <Row>
          <IconButton label="Take a photo" variant="primary">
            <Camera />
          </IconButton>
          <IconButton label="Search" variant="tonal">
            <Search />
          </IconButton>
          <IconButton label="Location" variant="outline">
            <MapPin />
          </IconButton>
          <IconButton label="Delete" size="sm">
            <Trash2 />
          </IconButton>
          <IconButton label="Add" size="lg" variant="primary">
            <Plus />
          </IconButton>
        </Row>
      </Section>

      <Section id="forms" title="Forms">
        <form
          className="grid max-w-3xl gap-6 sm:grid-cols-2"
          onSubmit={(event) => event.preventDefault()}
          noValidate
        >
          <Field label="Name" hint="What everyone calls them." required>
            <Input name="name" placeholder="Muffin" />
          </Field>
          <Field label="Nickname" optional>
            <Input name="nickname" />
          </Field>
          <Field label="Species" error="Pick a species or type your own.">
            <Input name="species" defaultValue="Mon" startAdornment={<Search />} />
          </Field>
          <Field label="Placement">
            <Select name="placement" defaultValue="indoor">
              <option value="indoor">Indoor</option>
              <option value="balcony">Balcony</option>
              <option value="garden">Garden</option>
            </Select>
          </Field>
          <Field label="Notes" hint="Anything a caretaker should know." className="sm:col-span-2">
            <Textarea name="notes" />
          </Field>
          <Field label="Disabled">
            <Input name="disabled" disabled defaultValue="Read only" />
          </Field>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Checkbox
              name="consent"
              label="I agree to the terms"
              description="Required to create an account."
            />
            <Checkbox name="newsletter" label="Send me care tips" defaultChecked />
            <Checkbox name="error" label="With an error" error="Please confirm." />
            <Checkbox name="off" label="Disabled" disabled />
          </div>
          <Switch
            className="sm:col-span-2"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            label="Public profile"
            description="Anyone with the link can see the name, photos and coarse location."
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Section>

      <Section id="cards" title="Cards, badges, chips">
        <Row>
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')} count={12}>
            All
          </Chip>
          <Chip
            selected={filter === 'animals'}
            onClick={() => setFilter('animals')}
            icon={<PawPrint />}
            count={7}
          >
            Animals
          </Chip>
          <Chip
            selected={filter === 'plants'}
            onClick={() => setFilter('plants')}
            icon={<Leaf />}
            count={5}
          >
            Plants
          </Chip>
          <Chip disabled>Archived</Chip>
        </Row>
        <Row>
          <Badge>Neutral</Badge>
          <Badge tone="primary" icon={<Leaf />}>
            Plant
          </Badge>
          <Badge tone="accent" icon={<Cat />}>
            Animal
          </Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">Healthy</Badge>
          <Badge tone="caution">Caution</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge size="sm">Small</Badge>
        </Row>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <Card as="li" className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Surface</h3>
            <p className="text-ink-muted">Default card on the canvas.</p>
          </Card>
          <Card as="li" tone="sunken" className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Sunken</h3>
            <p className="text-ink-muted">Grouping without a border.</p>
          </Card>
          <Card as="li" tone="primary" interactive className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Primary, interactive</h3>
            <a href="#cards" className="focus-ring rounded-control underline">
              Lifts on hover
            </a>
          </Card>
          <Card as="li" tone="accent" className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">Accent</h3>
            <p>Warm tint for the animal side.</p>
          </Card>
        </ul>
      </Section>

      <Section id="feedback" title="Alerts and toasts">
        <div className="flex max-w-2xl flex-col gap-3">
          <Alert tone="info" title="Watering tip">
            Monstera likes the top soil to dry out between waterings.
          </Alert>
          <Alert tone="success" onDismiss={() => undefined}>
            Profile saved.
          </Alert>
          <Alert
            tone="caution"
            title="Frost tonight"
            actions={
              <Button size="sm" variant="tonal">
                Move plants indoors
              </Button>
            }
          >
            Temperatures below 0 °C are expected in your area.
          </Alert>
          <Alert tone="danger" emphasis="strong" title="Toxic to cats">
            Lilies cause kidney failure in cats. Keep them apart.
          </Alert>
        </div>
        <Row>
          <Button variant="tonal" onClick={() => addToast('success', 'Muffin was fed.')}>
            Success toast
          </Button>
          <Button variant="tonal" onClick={() => addToast('info', 'Reminder set for 9:00.')}>
            Info toast
          </Button>
          <Button variant="tonal" onClick={() => addToast('warning', 'Storage almost full.')}>
            Warning toast
          </Button>
          <Button variant="tonal" onClick={() => addToast('error', 'Could not save.', 0)}>
            Error toast (sticky)
          </Button>
        </Row>
      </Section>

      <Section id="dialog" title="Dialog">
        <Row>
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Button variant="outline" onClick={() => setBusyDialogOpen(true)}>
            Open non-dismissible dialog
          </Button>
        </Row>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Archive Muffin?"
          description="The profile stays private to you and leaves every list."
          initialFocusRef={cancelRef}
          footer={
            <>
              <Button ref={cancelRef} variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Archive
              </Button>
            </>
          }
        >
          <Field label="Reason" optional>
            <Textarea name="reason" rows={2} />
          </Field>
        </Dialog>
        <Dialog
          open={busyDialogOpen}
          onClose={() => setBusyDialogOpen(false)}
          title="Uploading photos"
          dismissible={false}
          size="sm"
          footer={<Button onClick={() => setBusyDialogOpen(false)}>Done</Button>}
        >
          <div className="flex items-center gap-3 text-ink-muted">
            <Spinner announce />3 of 8 photos
          </div>
        </Dialog>
      </Section>

      <Section id="loading" title="Loading and empty">
        <Row>
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" announce />
        </Row>
        <div className="grid max-w-xl gap-4 sm:grid-cols-[auto_1fr]" aria-busy="true">
          <Skeleton shape="circle" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-1/2" />
            <Skeleton />
            <Skeleton shape="rect" />
          </div>
        </div>
        <EmptyState
          icon={<Flower2 />}
          title="No plants yet"
          description="Add the first one and we will remind you when it is thirsty."
          action={<Button leadingIcon={<Plus />}>Add a plant</Button>}
        />
      </Section>
    </div>
  );
}
