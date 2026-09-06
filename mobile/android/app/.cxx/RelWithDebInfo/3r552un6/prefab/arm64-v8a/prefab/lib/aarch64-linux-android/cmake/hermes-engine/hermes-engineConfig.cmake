if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/vanshjain/.gradle/caches/9.0.0/transforms/dcd889311910fc8ae3bd1d7c68714ac6/transformed/jetified-hermes-android-0.14.0-release/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/vanshjain/.gradle/caches/9.0.0/transforms/dcd889311910fc8ae3bd1d7c68714ac6/transformed/jetified-hermes-android-0.14.0-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

