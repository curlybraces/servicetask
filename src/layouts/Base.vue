<template>
  <q-layout view="hHr lpR fFf">
    <q-header elevated
      :class="headerClass"
      v-if="!$route.meta.noHeader && $store.state.firestore.loading === 1 && toolbar">
      <q-toolbar>
        <!-- Toolbar buttons -->
        <q-btn  v-if="$route.name !== 'dashboard'"
          @click="$router.go(-1)"
          flat round
          icon="keyboard_arrow_left"
          class="text-white" />
        <st-toolbar v-if="$route.meta.model" :model="$route.meta.model" />
        <component v-if="toolbarComponent" :is="toolbarComponent.component" :value="toolbarComponent.data" />

        <q-toolbar-title class="text-center" v-if="model">{{ title }}</q-toolbar-title>
        <q-toolbar-title class="text-center" v-else>{{ $t(title) }}</q-toolbar-title>

        <q-btn v-if="$q.platform.is.mobile"
          @click="drawer = true"
          flat round
          icon="view_list" class="text-white" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      :mini="drawerMini"
      @mouseover="drawerMini = false"
      @mouseout="drawerMini = true"
      mini-to-overlay
      side="right"
      :behavior="$q.platform.is.mobile ? 'mobile' : 'desktop'"
      elevated
      v-if="!$route.meta.noDrawer && $store.state.firestore.loading === 1">
      <div class="q-pa-none bg-grey-9 full-height">
        <q-scroll-area class="full-height">
          <div>
            <q-list class="text-white">
              <q-item :to="{ name: 'settings' }"
                :class="'bg-' + (meta.color || 'black')"
                style="height: 50px;">
                <q-item-section avatar>
                  <q-icon color="white" name="settings" />
                </q-item-section>
                <q-item-section class="text-bold">
                  {{ $user.data.name }}
                </q-item-section>
                <q-item-section side>
                  <q-btn round
                    size="sm"
                    color="white"
                    :class="'text-' + (meta.color || 'black')"
                    icon="logout"
                    @click.prevent="logout" />
                </q-item-section>
              </q-item>

              <!-- Add models in menu  -->
              <q-item v-for="route in $models.menu" :key="route.name" :to="{ name: route.name }">
                <q-item-section avatar>
                  <q-icon :color="route.meta.color" :name="route.meta.icon" />
                </q-item-section>
                <q-item-section>
                  {{ route.meta.title }}
                </q-item-section>

                <q-separator v-if="!drawerMini"
                  vertical class="q-mr-sm"
                  :color="route.meta.color" />

                <q-item-section side>
                  <q-btn v-if="!route.meta.createRoute"
                    flat round
                    size="sm"
                    :color="route.meta.color"
                    icon="add"
                    @click.prevent="showEditDialog(route.meta.model)" />
                  <q-btn v-else
                    flat round
                    size="sm"
                    :color="route.meta.color"
                    icon="add"
                    :to="{ name: route.meta.createRoute, params: { id: 'new' } }" />
                </q-item-section>
              </q-item>

              <q-item :to="{ name: 'calendar' }">
                <q-item-section avatar>
                  <q-icon color="white" name="event" />
                </q-item-section>
                <q-item-section>
                  {{$t('menu.calendar')}}
                </q-item-section>
              </q-item>
              <q-item :to="{ name: 'map' }">
                <q-item-section avatar>
                  <q-icon color="white" name="map" />
                </q-item-section>
                <q-item-section>
                  {{$t('menu.maps')}}
                </q-item-section>
              </q-item>

              <q-item :to="{ name: 'dashboard' }">
                <q-item-section avatar>
                  <q-icon color="grey" name="dashboard" />
                </q-item-section>
                <q-item-section>
                  {{$t('menu.dashboard')}}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-scroll-area>
      </div>
    </q-drawer>

    <q-page-container>
      <q-page class="bg-grey-3" style="height: calc(100vh - 50px)">
        <q-scroll-area class="full-height" :thumb-style="thumbStyle">
          <router-view v-if="$store.state.firestore.loading == 1 || $route.name === 'login'"
            @printing="prepareForPrinting"
            @donePrinting="restoreAfterPrinting"
            @mountToolbar="toolbarComponent = $event"
            ref="page" />
          <div v-else class="row justify-center text-center">
            <div class="col-8 col-offset-2" style="margin-top: 100px;">
              <q-circular-progress
                show-value
                font-size="10px"
                class="q-ma-md"
                :value="$firestore.loading * 100"
                size="100px"
                :thickness="0.25"
                color="primary"
                track-color="grey-3">
                <q-avatar size="75px">
                  <img src="statics/icons/icon-512x512.png" class="full-width" />
                </q-avatar>
              </q-circular-progress>
            </div>
          </div>
        </q-scroll-area>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import EditDialog from '../components/generic/EditDialog'

export default {
  name: 'Base',
  data () {
    return {
      drawer: !this.$q.platform.is.mobile,
      toolbar: true,
      drawerMini: true,
      toolbarComponent: undefined,
      thumbStyle: {
        backgroundColor: 'black',
        opacity: 1,
        right: '2px',
        borderRadius: '2.5px',
        width: '5px'
      }
    }
  },
  computed: {
    modelName () {
      return this.$route.meta.model
    },
    model () {
      return this.$route.meta.model ? this.$models[this.$route.meta.model] : false
    },
    route () {
      return this.model ? this.model.routes.filter(r => r.name === this.$route.name)[0] : this.$route
    },
    meta () {
      return this.route.meta
    },
    headerClass () {
      return 'bg-' + (this.meta.color || 'black') + ' text-white'
    },
    title () {
      return this.meta.title
    },
    selectedIds () {
      let selectedIds = []
      if (this.model) {
        const selected = this.$store.getters[this.$route.meta.store + '/filter']([['selected', '==', true]])
        selectedIds = selected.map(o => o.id)
      }
      return selectedIds
    }
  },
  methods: {
    logout () {
      this.$auth.signOut()
    },
    showEditDialog (model, data = undefined) {
      this.$q.dialog({
        component: EditDialog,
        parent: this,
        model: model,
        data: data,
        title: data === undefined ? 'Create a ' + model : 'Edit a ' + model
      })
    },
    prepareForPrinting () {
      this.drawer = false
      this.toolbar = false
    },
    restoreAfterPrinting () {
      this.drawer = true
      this.toolbar = true
    }
  },
  components: {
    StToolbar: () => import('./StToolbar')
  },
  watch: {
    '$route.name' () {
      this.toolbarComponent = undefined
    }
  }
}
</script>
