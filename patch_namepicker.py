#!/usr/bin/env python3

def patch_file(filepath, changes):
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in changes:
        if old not in content:
            print(f"WARNING: Could not find pattern in {filepath}:")
            print(repr(old[:200]))
            continue
        content = content.replace(old, new, 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

base = '/Users/martinurbanczyk/Documents/Work/sports-app/frontend/src/views'

# File 1: LugeView.vue
patch_file(f'{base}/LugeView.vue', [
    ("import '../assets/sport-view.css'",
     "import '../assets/sport-view.css'\nimport NamePicker from '../components/NamePicker.vue'"),
    ("const showAthleteModal = ref(false)",
     "const showAthleteModal = ref(false)\nconst showNamePicker = ref(false)"),
    ("function closeAthleteModal()",
     """function handleNamePicked(data) {
  athleteForm.value.first_name = data.first_name
  athleteForm.value.last_name = data.last_name
  if (data.country_code) athleteForm.value.country = data.country_code
}

function closeAthleteModal()"""),
    ("""          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Create New Athlete' }}</h2>
          <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>""",
     """          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Create New Athlete' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>"""),
    ("</template>\n\n<script setup>",
     "    <NamePicker v-model=\"showNamePicker\" @select=\"handleNamePicked\" />\n  </template>\n\n<script setup>"),
])

# File 2: SkeletonView.vue
patch_file(f'{base}/SkeletonView.vue', [
    ("import '../assets/sport-view.css'",
     "import '../assets/sport-view.css'\nimport NamePicker from '../components/NamePicker.vue'"),
    ("const showAthleteModal = ref(false)",
     "const showAthleteModal = ref(false)\nconst showNamePicker = ref(false)"),
    ("function closeAthleteModal()",
     """function handleNamePicked(data) {
  athleteForm.value.first_name = data.first_name
  athleteForm.value.last_name = data.last_name
  if (data.country_code) athleteForm.value.country = data.country_code
}

function closeAthleteModal()"""),
    ("""          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Create New Athlete' }}</h2>
          <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>""",
     """          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Create New Athlete' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>"""),
    ("</template>\n\n<script setup>",
     "    <NamePicker v-model=\"showNamePicker\" @select=\"handleNamePicked\" />\n  </template>\n\n<script setup>"),
])

# File 3: SpeedSkatingView.vue
patch_file(f'{base}/SpeedSkatingView.vue', [
    ("import '../assets/sport-view.css'",
     "import '../assets/sport-view.css'\nimport NamePicker from '../components/NamePicker.vue'"),
    ("const showSkaterModal = ref(false)",
     "const showSkaterModal = ref(false)\nconst showNamePicker = ref(false)"),
    ("function closeSkaterModal()",
     """function handleNamePicked(data) {
  skaterForm.value.first_name = data.first_name
  skaterForm.value.last_name = data.last_name
  if (data.country_code) skaterForm.value.country = data.country_code
}

function closeSkaterModal()"""),
    ("""          <h2>{{ editingSkater ? 'Edit Skater' : 'Create New Skater' }}</h2>
          <button @click="closeSkaterModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>""",
     """          <h2>{{ editingSkater ? 'Edit Skater' : 'Create New Skater' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeSkaterModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>"""),
    ("</template>\n\n<script setup>",
     "    <NamePicker v-model=\"showNamePicker\" @select=\"handleNamePicked\" />\n  </template>\n\n<script setup>"),
])

# File 4: TennisWorldView.vue
patch_file(f'{base}/TennisWorldView.vue', [
    ("import { useTennisStore } from '../stores/tennis'",
     "import { useTennisStore } from '../stores/tennis'\nimport NamePicker from '../components/NamePicker.vue'"),
    ("const showAddPlayer = ref(false)",
     "const showAddPlayer = ref(false)\nconst showNamePicker = ref(false)"),
    ("function closeAddPlayerModal()",
     """function handleNamePicked(data) {
  newPlayer.value.first_name = data.first_name
  newPlayer.value.last_name = data.last_name
  if (data.country_code) newPlayer.value.country = data.country_code
}

function closeAddPlayerModal()"""),
    ("""          <h2>Add New Player</h2>
          <button @click="closeAddPlayerModal" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>""",
     """          <h2>Add New Player</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAddPlayerModal" class="btn btn-ghost">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>"""),
    ("</template>\n\n<script setup>",
     "    <NamePicker v-model=\"showNamePicker\" @select=\"handleNamePicked\" />\n  </template>\n\n<script setup>"),
])

# File 5: MMAOrganizationView.vue
patch_file(f'{base}/MMAOrganizationView.vue', [
    ("import { useMMAStore } from '../stores/mma'",
     "import { useMMAStore } from '../stores/mma'\nimport NamePicker from '../components/NamePicker.vue'"),
    ("const showAddFighterModal = ref(false)",
     "const showAddFighterModal = ref(false)\nconst showNamePicker = ref(false)"),
    ("function closeModals()",
     """function handleNamePicked(data) {
  fighterForm.value.first_name = data.first_name
  fighterForm.value.last_name = data.last_name
  if (data.country_code) fighterForm.value.country_code = data.country_code
}

function closeModals()"""),
    ("""          <h2>{{ showEditFighterModal ? 'Edit Fighter' : 'Add Fighter' }}</h2>
          <button @click="closeModals" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>""",
     """          <h2>{{ showEditFighterModal ? 'Edit Fighter' : 'Add Fighter' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeModals" class="btn btn-ghost">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>"""),
    ("</template>\n\n<script setup>",
     "    <NamePicker v-model=\"showNamePicker\" @select=\"handleNamePicked\" />\n  </template>\n\n<script setup>"),
])

print("All done!")
